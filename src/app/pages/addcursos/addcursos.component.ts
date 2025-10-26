import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { NavbarComponent } from '../shared/navbar/navbar.component';
import { CursosService } from '../../services/server/cursos.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-addcursos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './addcursos.component.html',
  styleUrls: ['./addcursos.component.css']
})
export class AddcursosComponent implements OnInit {
  cursoForm!: FormGroup;
  docenteId: string = '';
  cursos: any[] = [];
  ready = false;

  constructor(
    private fb: FormBuilder,
    private cursosService: CursosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      const usuario = JSON.parse(data);
      this.docenteId = usuario.id;
    }

    this.cursoForm = this.fb.group({
      nombre: ['', Validators.required],
      nivel: ['', Validators.required],
      paralelo: ['', Validators.required]
    });

    // Mostrar loader inicial antes de cargar cursos
    Swal.fire({
      title: 'Cargando cursos...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cursosService.getCursosPorDocente(this.docenteId)
      .pipe(
        finalize(() => {
          // Siempre cerrar loader y mostrar contenido
          Swal.close();
          this.ready = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.cursos = res.cursos || [];
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudieron cargar los cursos.', 'error');
          console.error('Error al obtener cursos:', err);
        }
      });
  }

  onSubmit(): void {
    if (this.cursoForm.valid && this.docenteId) {
      const data = {
        ...this.cursoForm.value,
        docente_id: this.docenteId
      };

      // Loader mientras se guarda el nuevo curso
      Swal.fire({
        title: 'Guardando curso...',
        text: 'Por favor espera un momento',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      this.cursosService.addCurso(data)
        .pipe(finalize(() => Swal.close()))
        .subscribe({
          next: (res) => {
            Swal.fire({
              icon: 'success',
              title: 'Curso añadido correctamente',
              text: res.mensaje || 'El curso ha sido registrado exitosamente.',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              this.cursoForm.reset();
              this.ready = false;

              // Mostrar loader mientras recargamos cursos
              Swal.fire({
                title: 'Actualizando lista...',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
              });

              this.cargarCursos();
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.error || 'No se pudo registrar el curso.',
              confirmButtonText: 'Aceptar'
            });
          }
        });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos antes de continuar.',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  irAEstudiantes(cursoId: string): void {
    this.router.navigate(['/cursos', cursoId, 'estudiantes']);
  }

  irAMaterias(cursoId: string): void {
    this.router.navigate(['/cursos', cursoId, 'materias']);
  }
}
