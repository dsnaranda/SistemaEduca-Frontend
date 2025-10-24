import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../services/server/login.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isPasswordVisible: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private loginService: LoginService) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { correo, password } = this.loginForm.value;

      Swal.fire({
        title: 'Cargando...',
        text: 'Estamos procesando tu solicitud',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.loginService.login(correo, password).subscribe({
        next: (response) => {
          Swal.close();

          if (response && response.usuario && response.token) {
            // ✅ Guardar el token y el usuario en localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('usuario', JSON.stringify(response.usuario));

            Swal.fire({
              title: '¡Bienvenido!',
              text: `Hola ${response.usuario.nombres}`,
              icon: 'success',
              confirmButtonText: 'Continuar'
            }).then(() => {
              this.router.navigate(['/home']);
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se recibió respuesta válida del servidor.',
              icon: 'error'
            });
          }
        },
        error: (err) => {
          Swal.close();

          const errorMsg = err?.error?.error || 'Hubo un problema al iniciar sesión.';

          Swal.fire({
            title: 'Error',
            text: errorMsg,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, completa todos los campos correctamente.',
        icon: 'warning'
      });
    }
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
