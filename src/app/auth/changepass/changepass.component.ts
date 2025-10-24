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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la URL
    const userId = this.route.snapshot.paramMap.get('id');
    this.changedata.id = userId;

    console.log('ID obtenido desde la URL:', userId);

    // Obtener correo guardado
    const correo = localStorage.getItem('correo_recuperacion');
    if (correo) {
      this.changedata.correo = correo;
    }

    // Crear formulario reactivo
    this.passwordForm = this.fb.group({
      clave: ['', [Validators.required, Validators.minLength(6)]],
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

    // Mostrar los datos en consola para verificación
    console.log('ID del usuario:', this.changedata.id);
    console.log('Nueva contraseña ingresada:', clave);

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
        console.log('✅ Respuesta del servidor:', res);

        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: 'Tu contraseña se cambió correctamente. Ahora puedes iniciar sesión.',
          confirmButtonColor: '#4F46E5'
        }).then(() => {
          localStorage.removeItem('validacion_id');
          this.router.navigate(['/login']);
        });
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