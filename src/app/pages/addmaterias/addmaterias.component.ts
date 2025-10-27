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

      // Inicializar formulario
      if (!this.materiasForm) {
        this.materiasForm = this.fb.group({
          materias: this.fb.array([this.crearMateria()])
        });
      } else {
        this.materias.clear();
        this.materias.push(this.crearMateria());
      }

      // Cargar curso desde localStorage
      this.cargarCursoDesdeLocalStorage();

      // Mostrar loader inicial
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
    }

    // Si no lo encuentra en localStorage → buscar en API del docente
    if (!this.cursoSeleccionado) {
      const data = localStorage.getItem('usuario');
      if (!data) {
        console.warn('No se encontró información del usuario en localStorage.');
        this.cursoSeleccionado = null;
        return;
      }

      const usuario = JSON.parse(data);
      const docenteId = usuario.id;

      this.cursosService.getCursosPorDocente(docenteId).subscribe({
        next: (res: any) => {
          if (res && Array.isArray(res.cursos)) {
            const cursoEncontrado = res.cursos.find(
              (c: any) => c.id === this.cursoId || c._id === this.cursoId
            );

            if (cursoEncontrado) {
              this.cursoSeleccionado = cursoEncontrado;
            } else {
              // No lo encontró entre los cursos del docente → buscar en todos los cursos
              console.warn('El curso no fue encontrado en los cursos del docente. Intentando buscar en todos los cursos...');
              this.buscarCursoEnTodos();
            }
          } else {
            console.warn('Respuesta inesperada al obtener cursos por docente:', res);
            this.buscarCursoEnTodos();
          }
        },
        error: (err) => {
          console.error('Error al obtener cursos desde la API del docente:', err);
          this.buscarCursoEnTodos();
        }
      });
    }
  }

  private buscarCursoEnTodos(): void {
    this.cursosService.getTodosLosCursos().subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res.cursos)) {
          const cursoEncontrado = res.cursos.find(
            (c: any) => c.id === this.cursoId || c._id === this.cursoId
          );
          if (cursoEncontrado) {
            this.cursoSeleccionado = cursoEncontrado;
          } else {
            console.warn('El curso no fue encontrado ni en los cursos del docente ni en todos los cursos.');
            this.cursoSeleccionado = null;
          }
        }
      },
      error: (err) => {
        console.error('Error al obtener la lista completa de cursos:', err);
        this.cursoSeleccionado = null;
      }
    });
  }

  private cargarMaterias(): void {
    this.cursosService.getMateriasPorCurso(this.cursoId)
      .pipe(
        finalize(() => {
          Swal.close();
          this.ready = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.materiasLista = Array.isArray(res) ? res : (res.materias || []);
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

    // Loader durante guardado
    Swal.fire({
      title: 'Guardando materias...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursosService.addMaterias(this.cursoId, materias).subscribe({
      next: () => {
        // 🔹 Cierra el loader antes de mostrar el éxito
        Swal.close();

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Materias añadidas correctamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.materiasForm.reset();
          this.materias.clear();
          this.materias.push(this.crearMateria());
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
        // 🔹 Cierra el loader antes de mostrar el error
        Swal.close();
        console.error('Error al guardar materias:', err);

        const errorData = err?.error || {};
        const errorMsg =
          typeof errorData === 'string'
            ? errorData
            : errorData.error || 'No se pudieron guardar las materias.';
        const duplicadas = Array.isArray(errorData.duplicadas)
          ? errorData.duplicadas
          : [];

        if (duplicadas.length > 0) {
          const listaHtml = duplicadas.map((m: string) => `• ${m}`).join('<br>');
          Swal.fire({
            icon: 'warning',
            title: 'Materias duplicadas',
            html: `
              <p>${errorMsg}</p>
              <div class="mt-2 text-left text-sm text-gray-700">
                ${listaHtml}
              </div>
            `,
            confirmButtonColor: '#4F46E5',
            confirmButtonText: 'Aceptar'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMsg || 'Ocurrió un error desconocido.',
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  }

  onMateriaSeleccionada(event: any): void {
    const nombreSeleccionado = event.target.value;
    if (!nombreSeleccionado) return;

    const materiaSeleccionada = this.materiasBasicas.find(m => m.nombre === nombreSeleccionado);
    if (!materiaSeleccionada) return;

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

    const filaVacia = this.materias.controls.find(ctrl => {
      const nombre = ctrl.get('nombre')?.value?.trim();
      const descripcion = ctrl.get('descripcion')?.value?.trim();
      return !nombre && !descripcion;
    });

    if (filaVacia) {
      filaVacia.patchValue({
        nombre: materiaSeleccionada.nombre,
        descripcion: materiaSeleccionada.descripcion
      });
    } else {
      const nuevaMateria = this.fb.group({
        nombre: [materiaSeleccionada.nombre, Validators.required],
        descripcion: [materiaSeleccionada.descripcion, Validators.required]
      });
      this.materias.push(nuevaMateria);
    }

    event.target.value = '';
  }

  irAtras(): void {
      this.router.navigate(['/addcursos']);
  }
}
