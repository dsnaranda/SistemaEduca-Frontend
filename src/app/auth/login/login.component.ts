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
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.loginService.login(correo, password).subscribe({
        next: (response) => {
          Swal.close();
          if (response && response.usuario) {
            console.log('Usuario autenticado:', response.usuario);
            Swal.fire({
              title: '¡Bienvenido!',
              text: 'Has iniciado sesión correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.router.navigate(['/home']);
          } else {
            // El usuario no fue encontrado
            console.log('Error: Usuario no encontrado');
            Swal.fire({
              title: 'Error',
              text: response?.error || 'No se encontró el usuario, por favor revisa tus credenciales.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        },
        error: (err) => {
          Swal.close();
          if (err?.error?.error === 'El correo no está registrado') {
            Swal.fire({
              title: 'Error',
              text: 'El correo no está registrado.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          } else if (err?.error?.error === 'Contraseña incorrecta') {
            //  incorrecta
            Swal.fire({
              title: 'Error',
              text: 'La contraseña es incorrecta.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          } else {
            // fallo interno
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al iniciar sesión, por favor intenta nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        }
      });
    } else {
      console.log('Formulario no válido');
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, completa todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
    }
  }


  constructor(private fb: FormBuilder, private router: Router, private loginService: LoginService) { }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
