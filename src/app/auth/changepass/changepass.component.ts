import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { LoginService } from '../../services/server/login.service';

@Component({
  selector: 'app-changepass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './changepass.component.html',
  styleUrl: './changepass.component.css'
})
export class ChangepassComponent implements OnInit {

  passwordForm!: FormGroup;
  isPasswordVisible = false;
  changedata: any = { id: '', correo: '' };
  isAuthenticated = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
    // Verificar autenticación (solo para mostrar si hay sesión)
    const token = localStorage.getItem('token');
    this.isAuthenticated = !!token;

    // Obtener el ID desde la URL (caso enlace)
    const userId = this.route.snapshot.paramMap.get('id');
    this.changedata.id = userId;

    console.log('ID obtenido desde la URL:', userId);

    // Detectar si está en la ruta /perfil (sin id)
    if (!userId) {
      const userData = localStorage.getItem('usuario');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.changedata.id = user._id || user.id;
          this.changedata.correo = user.correo;
          console.log('Cambio de contraseña desde PERFIL, id:', this.changedata.id);
        } catch (error) {
          console.error('Error al leer usuario del localStorage:', error);
          Swal.fire('Error', 'No se pudo obtener la información del usuario.', 'error');
          this.router.navigate(['/login']);
          return;
        }
      } else {
        Swal.fire('Error', 'Debe iniciar sesión para cambiar su contraseña.', 'error');
        this.router.navigate(['/login']);
        return;
      }
    } else {
      // Si viene de enlace (changepass/:id)
      const correo = localStorage.getItem('correo_recuperacion');
      if (correo) {
        this.changedata.correo = correo;
      }
    }

    // Crear formulario
    this.passwordForm = this.fb.group({
      clave: ['', [Validators.required]],
      confirmarclave: ['', [Validators.required]]
    });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      Swal.fire('Atención', 'Por favor completa todos los campos.', 'warning');
      return;
    }

    const { clave, confirmarclave } = this.passwordForm.value;

    if (clave !== confirmarclave) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    Swal.fire({
      title: 'Confirmar cambio de contraseña',
      text: '¿Deseas continuar con el cambio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cambiarContrasena(clave);
      }
    });
  }

  cambiarContrasena(clave: string): void {
    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.loginService.cambiarContrasena(this.changedata.id, clave).subscribe({
      next: (res: any) => {
        Swal.close();
        console.log('Respuesta del servidor:', res);

        // Si viene desde PERFIL, no redirigimos al login
        if (!this.route.snapshot.paramMap.get('id')) {
          Swal.fire({
            icon: 'success',
            title: 'Contraseña actualizada',
            text: 'Tu contraseña ha sido cambiada correctamente.',
            confirmButtonColor: '#4F46E5'
          });
        } else {
          // Si viene desde enlace externo (changepass/:id)
          Swal.fire({
            icon: 'success',
            title: 'Contraseña actualizada',
            text: 'Tu contraseña se cambió correctamente. Ahora puedes iniciar sesión.',
            confirmButtonColor: '#4F46E5'
          }).then(() => {
            localStorage.removeItem('validacion_id');
            this.router.navigate(['/login']);
          });
        }
      },
      error: (err) => {
        Swal.close();
        console.error('Error al cambiar contraseña:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cambiar la contraseña. El enlace podría no ser válido.',
          confirmButtonColor: '#4F46E5',
        });
      },
    });
  }
}
