import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../services/server/login.service';
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
  docentes: any[] = [];
  ready = false;
  docenteNombre: string = '';

  constructor(
    private fb: FormBuilder,
    private cursosService: CursosService,
    private router: Router,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      const usuario = JSON.parse(data);
      this.docenteId = usuario.id;
    }

    // Inicializamos el formulario correctamente
    this.cursoForm = this.fb.group({
      nombre: ['', Validators.required],
      nivel: ['', Validators.required],
      paralelo: ['', Validators.required],
      docente_id: [''] // Valor inicial vacío
    });

    // Mostrar loader antes de cargar docentes y cursos
    Swal.fire({
      title: 'Cargando información...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    // Primero cargamos docentes
    this.loginService.obtenerDocentes().subscribe({
      next: (docentes) => {
        this.docentes = docentes || [];
        this.cargarCursos(); // Luego cargamos cursos
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudieron cargar los docentes.', 'error');
        console.error('Error al obtener docentes:', err);
        Swal.close();
      }
    });
  }


  cargarCursos(): void {
    this.cursosService.getCursosPorDocente(this.docenteId)
      .pipe(
        finalize(() => {
          Swal.close();
          this.ready = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.cursos = res.cursos || [];

          // 🔹 Extraer el nombre del docente desde el mensaje
          if (res.mensaje) {
            const match = res.mensaje.match(/docente\s(.+)/i);
            this.docenteNombre = match ? match[1] : ''; // "Cesar Aguacondo"
          } else {
            this.docenteNombre = '';
          }
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudieron cargar los cursos.', 'error');
          console.error('Error al obtener cursos:', err);
        }
      });
  }

  onSubmit(): void {
    if (this.cursoForm.valid) {
      const data = this.cursoForm.value;

      Swal.fire({
        title: 'Guardando curso...',
        text: 'Por favor espera un momento',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      // Llamamos al servicio usando el docente seleccionado
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
              // Reset completo del formulario (incluye el combo)
              this.cursoForm.reset({
                nombre: '',
                nivel: '',
                paralelo: '',
                docente_id: ''
              });

              this.ready = false;

              // Loader mientras recargamos cursos
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
