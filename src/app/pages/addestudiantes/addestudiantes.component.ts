import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
import Swal from 'sweetalert2';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-addestudiantes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './addestudiantes.component.html',
  styleUrl: './addestudiantes.component.css'
})
export class AddestudiantesComponent implements OnInit {
  cursoId = '';
  cursoSeleccionado: any = null;
  estudiantesForm!: FormGroup;
  estudiantesLista: any[] = [];
  ready = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((pm) => {
      const id = pm.get('id') || '';
      if (!id) {
        Swal.fire('Error', 'No se encontró el curso en la URL.', 'error');
        this.router.navigate(['/home']);
        return;
      }

      this.cursoId = id;

      if (!this.estudiantesForm) {
        this.estudiantesForm = this.fb.group({
          estudiantes: this.fb.array([this.crearEstudiante()])
        });
      } else {
        this.estudiantes.clear();
        this.estudiantes.push(this.crearEstudiante());
      }

      // Mostrar loader inicial antes de cargar datos
      Swal.fire({
        title: 'Cargando estudiantes...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      this.cargarCursoDesdeLocalStorage();
      this.cargarEstudiantes();
    });
  }

  get estudiantes(): FormArray {
    return this.estudiantesForm.get('estudiantes') as FormArray;
  }

  crearEstudiante(): FormGroup {
    return this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      ci: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['automatica']
    });
  }

  agregarFila(): void {
    this.estudiantes.push(this.crearEstudiante());
  }

  eliminarFila(index: number): void {
    if (this.estudiantes.length > 1) this.estudiantes.removeAt(index);
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

  // Obtener los estudiantes del curso
  cargarEstudiantes(): void {
    this.cursosService.getEstudiantesPorCurso(this.cursoId)
      .pipe(
        finalize(() => {
          // Cerrar loader y mostrar el contenido
          Swal.close();
          this.ready = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.estudiantesLista = res.estudiantes || [];
          console.log('Estudiantes del curso:', this.estudiantesLista);
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudieron cargar los estudiantes.', 'error');
          console.error('Error al obtener estudiantes:', err);
          this.estudiantesLista = [];
        }
      });
  }

  onSubmit(): void {
    this.estudiantes.markAllAsTouched();

    if (!this.estudiantesForm.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos antes de guardar.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const estudiantes = this.estudiantesForm.value.estudiantes;

    // Loader durante el guardado
    Swal.fire({
      title: 'Guardando estudiantes...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursosService.addEstudiantes(this.cursoId, estudiantes)
      .pipe(finalize(() => Swal.close()))
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: res.mensaje || 'Estudiantes añadidos correctamente.',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.estudiantesForm.reset();
            this.estudiantes.clear();
            this.estudiantes.push(this.crearEstudiante());

            // Mostrar loader breve mientras recargamos
            this.ready = false;
            Swal.fire({
              title: 'Actualizando lista...',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => Swal.showLoading()
            });
            this.cargarEstudiantes();
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.error || 'No se pudieron guardar los estudiantes.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }
}
