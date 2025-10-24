import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
import Swal from 'sweetalert2';
import { NavbarComponent } from '../shared/navbar/navbar.component';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 👉 Suscríbete al id de la URL
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
        // si cambió de curso, limpia el form
        this.materias.clear();
        this.materias.push(this.crearMateria());
      }

      // Cargar datos dependientes del id
      this.cargarCursoDesdeLocalStorage();
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
      // OJO: asegúrate de comparar con la propiedad correcta (id vs _id)
      this.cursoSeleccionado =
        lista.find((c: any) => c.id === this.cursoId || c._id === this.cursoId) || null;
    } else {
      this.cursoSeleccionado = null;
    }
  }

  private cargarMaterias(): void {
    this.cursosService.getMateriasPorCurso(this.cursoId).subscribe({
      next: (res) => {
        this.materiasLista = Array.isArray(res) ? res : (res.materias || []);
        console.log('Materias del curso', this.cursoId, this.materiasLista);
      },
      error: (err) => console.error('Error al obtener materias:', err)
    });
  }

  onSubmit(): void {
    this.materias.markAllAsTouched();

    if (!this.materiasForm.valid) {
      Swal.fire('Formulario inválido', 'Por favor completa todos los campos.', 'warning');
      return;
    }

    const materias = this.materiasForm.value.materias;

    Swal.fire({
      title: 'Guardando materias...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursosService.addMaterias(this.cursoId, materias).subscribe({
      next: () => {
        Swal.close();
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Materias añadidas correctamente.' })
          .then(() => {
            // 🔁 Refresca SOLO los datos en esta misma ruta
            this.materiasForm.reset();
            this.materias.clear();
            this.materias.push(this.crearMateria());
            this.cargarMaterias();
          });
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', err.error?.error || 'No se pudieron guardar las materias.', 'error');
      }
    });
  }
}
