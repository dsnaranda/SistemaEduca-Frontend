import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormsModule, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
import { LoginService } from '../../services/server/login.service';
import Swal from 'sweetalert2';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-addestudiantes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, FormsModule],
  templateUrl: './addestudiantes.component.html',
  styleUrl: './addestudiantes.component.css'
})
export class AddestudiantesComponent implements OnInit {
  cursoId = '';
  cursoSeleccionado: any = null;
  estudiantesForm!: FormGroup;
  estudiantesLista: any[] = [];
  ready = false;
  mostrarModal = false;
  estudianteSeleccionado: any = {};

  abrirModal(estudiante: any) {
    this.estudianteSeleccionado = { ...estudiante };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private loginService: LoginService,
    private router: Router
  ) { }

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
    const grupo = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      ci: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]+$/),
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        ],
      ],
      password: [''], 
    });
    grupo.get('ci')?.valueChanges.subscribe((ciValue) => {
      grupo.get('password')?.setValue(ciValue || '', { emitEvent: false });
    });

    return grupo;
  }


  onInputChange(estudiante: AbstractControl, campo: string): void {
    const grupo = estudiante as FormGroup;
    const control = grupo.get(campo);
    if (control) {
      control.markAsDirty();
      if (control.hasError('duplicado')) {
        const currentErrors = { ...control.errors };
        delete currentErrors['duplicado'];
        control.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        control.updateValueAndValidity({ onlySelf: true });
      }
    }
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

    this.cursosService.addEstudiantes(this.cursoId, estudiantes).subscribe({
      next: (res) => {
        Swal.close();
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
        Swal.close();

        // Detectar mensaje de error real
        const msg =
          err.error?.error ||
          err.error?.message ||
          err.error?.msg ||
          'No se pudieron guardar los estudiantes.';

        // Formatear para el swal
        const htmlMsg = msg.replace(/\n/g, '<br>').replace(/•/g, '<br>•');

        Swal.fire({
          icon: 'error',
          title: 'Error al guardar estudiantes',
          html: htmlMsg,
          confirmButtonText: 'Aceptar'
        });

        // Buscar duplicados si existen
        // Buscar duplicados si existen
        if (msg.includes('registrados')) {
          const regexCorreo = /\(([^)]+@[^)]+)\)/g;
          const regexCi = /\(CI:\s*([0-9]{10})/g;

          const correosDuplicados = Array.from(
            msg.matchAll(regexCorreo) as IterableIterator<RegExpMatchArray>,
            (m: RegExpMatchArray) => m[1]
          );

          const ciDuplicados = Array.from(
            msg.matchAll(regexCi) as IterableIterator<RegExpMatchArray>,
            (m: RegExpMatchArray) => m[1]
          );

          // Marcar campos duplicados en el formulario
          this.estudiantes.controls.forEach((ctrl) => {
            const grupo = ctrl as FormGroup;
            const ciCtrl = grupo.get('ci');
            const emailCtrl = grupo.get('email');
            const ci = ciCtrl?.value;
            const email = emailCtrl?.value;

            // Si la cédula está duplicada
            if (ciDuplicados.includes(ci)) {
              ciCtrl?.setErrors({ ...(ciCtrl.errors || {}), duplicado: true });
              ciCtrl?.markAsDirty();
              ciCtrl?.updateValueAndValidity();
            }

            // Si el correo está duplicado
            if (correosDuplicados.includes(email)) {
              emailCtrl?.setErrors({ ...(emailCtrl.errors || {}), duplicado: true });
              emailCtrl?.markAsDirty();
              emailCtrl?.updateValueAndValidity();
            }
          });
        }

      }
    });
  }

  guardarCambios() {
    const { id, _id, nombres, apellidos, ci, email } = this.estudianteSeleccionado;

    if (!nombres || !apellidos || !ci || !email) {
      Swal.fire('Atención', 'Todos los campos son obligatorios', 'warning');
      return;
    }

    if (!/^[0-9]{1,10}$/.test(ci)) {
      Swal.fire('Atención', 'La cédula solo puede contener números (máx. 10)', 'warning');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire('Atención', 'Correo electrónico inválido', 'warning');
      return;
    }

    Swal.fire({
      title: 'Guardando cambios...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.loginService.updateUsuario(id || _id, { nombres, apellidos, ci, email }).subscribe({
      next: (res) => {
        Swal.close();
        Swal.fire('Éxito', res.mensaje || 'Datos actualizados correctamente', 'success');
        this.cerrarModal();
        this.cargarEstudiantes();
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', err.error?.error || 'Error al actualizar el usuario.', 'error');
      }
    });
  }

  irAtras(): void {
    this.router.navigate(['/addcursos']);
  }

}
