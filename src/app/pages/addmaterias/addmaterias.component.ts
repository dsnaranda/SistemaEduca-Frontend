import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
import Swal from 'sweetalert2';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-addmaterias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './addmaterias.component.html',
  styleUrls: ['./addmaterias.component.css']
})
export class AddmateriasComponent implements OnInit {
  cursoId = '';
  cursoSeleccionado: any = null;
  materiasForm!: FormGroup;
  materiasLista: any[] = [];
  ready = false;
  materiasBasicas = [
    { nombre: 'Matemáticas', descripcion: 'Desarrollo del pensamiento lógico y resolución de problemas.' },
    { nombre: 'Ciencias Naturales', descripcion: 'Exploración del entorno natural y fenómenos científicos.' },
    { nombre: 'Ciencias Sociales', descripcion: 'Conocimiento de la sociedad, historia y cultura.' },
    { nombre: 'Lengua y Literatura', descripcion: 'Lectura, escritura y comprensión del idioma español.' },
    { nombre: 'Educación Cultural y Artística', descripcion: 'Desarrollo de la creatividad y expresión artística.' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id') || '';
      if (!id) {
        Swal.fire('Error', 'No se encontró el curso en la URL.', 'error');
        this.router.navigate(['/home']);
        return;
      }

      this.cursoId = id;

      // Inicializa formulario si aún no existe
      if (!this.materiasForm) {
        this.materiasForm = this.fb.group({
          materias: this.fb.array([this.crearMateria()])
        });
      } else {
        // Si cambió de curso, limpia el form
        this.materias.clear();
        this.materias.push(this.crearMateria());
      }

      // Carga dependencias del curso
      this.cargarCursoDesdeLocalStorage();

      // loader antes de pedir materias
      Swal.fire({
        title: 'Cargando información del curso...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      this.cargarMaterias();
    });
  }

  get materias(): FormArray {
    return this.materiasForm.get('materias') as FormArray;
  }

  crearMateria(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  agregarFila(): void {
    this.materias.push(this.crearMateria());
  }

  eliminarFila(index: number): void {
    if (this.materias.length > 1) this.materias.removeAt(index);
  }

  private cargarCursoDesdeLocalStorage(): void {
    const guardados = localStorage.getItem('cursosDocente');
    if (guardados) {
      const lista = JSON.parse(guardados);
      this.cursoSeleccionado =
        lista.find((c: any) => c.id === this.cursoId || c._id === this.cursoId) || null;
    } else {
      this.cursoSeleccionado = null;
    }
  }

  private cargarMaterias(): void {
    this.cursosService.getMateriasPorCurso(this.cursoId)
      .pipe(
        finalize(() => {
          // cierre garantizado del loader y mostramos contenido
          Swal.close();
          this.ready = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.materiasLista = Array.isArray(res) ? res : (res.materias || []);
          // console.log('Materias del curso', this.cursoId, this.materiasLista);
        },
        error: (err) => {
          Swal.fire('Error', 'Error al obtener materias.', 'error');
          console.error('Error al obtener materias:', err);
        }
      });
  }

  onSubmit(): void {
    this.materias.markAllAsTouched();

    if (!this.materiasForm.valid) {
      Swal.fire('Formulario inválido', 'Por favor completa todos los campos.', 'warning');
      return;
    }

    const materias = this.materiasForm.value.materias;

    // Loader durante guardado (independiente del inicial)
    Swal.fire({
      title: 'Guardando materias...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursosService.addMaterias(this.cursoId, materias)
      .pipe(finalize(() => Swal.close()))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Materias añadidas correctamente.'
          }).then(() => {
            // Refresca SOLO los datos en esta misma ruta
            this.materiasForm.reset();
            this.materias.clear();
            this.materias.push(this.crearMateria());
            // Puedes mostrar un mini loader opcional aquí si quieres
            this.ready = false;
            Swal.fire({
              title: 'Actualizando lista...',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => Swal.showLoading()
            });
            this.cargarMaterias();
          });
        },
        error: (err) => {
          Swal.fire('Error', err.error?.error || 'No se pudieron guardar las materias.', 'error');
        }
      });
  }

  onMateriaSeleccionada(event: any): void {
    const nombreSeleccionado = event.target.value;
    if (!nombreSeleccionado) return;

    const materiaSeleccionada = this.materiasBasicas.find(m => m.nombre === nombreSeleccionado);
    if (!materiaSeleccionada) return;

    // Verificar si ya está en el formulario
    const yaExiste = this.materias.controls.some(ctrl => {
      const nombre = ctrl.get('nombre')?.value?.trim().toLowerCase();
      return nombre === materiaSeleccionada.nombre.toLowerCase();
    });

    if (yaExiste) {
      Swal.fire({
        icon: 'info',
        title: 'Materia ya agregada',
        text: `La materia "${materiaSeleccionada.nombre}" ya se encuentra en el formulario.`,
        confirmButtonColor: '#4F46E5'
      });
      event.target.value = ''; 
      return;
    }

    // Buscar una fila vacía existente
    const filaVacia = this.materias.controls.find(ctrl => {
      const nombre = ctrl.get('nombre')?.value?.trim();
      const descripcion = ctrl.get('descripcion')?.value?.trim();
      return !nombre && !descripcion;
    });

    if (filaVacia) {
      // Llenar la fila vacía
      filaVacia.patchValue({
        nombre: materiaSeleccionada.nombre,
        descripcion: materiaSeleccionada.descripcion
      });
    } else {
      // Crear nueva fila con los datos
      const nuevaMateria = this.fb.group({
        nombre: [materiaSeleccionada.nombre, Validators.required],
        descripcion: [materiaSeleccionada.descripcion, Validators.required]
      });
      this.materias.push(nuevaMateria);
    }

    // Limpiar el combo box
    event.target.value = '';
  }


}
