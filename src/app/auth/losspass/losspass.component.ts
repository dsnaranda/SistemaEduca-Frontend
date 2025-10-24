import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { LoginService } from '../../services/server/login.service';

@Component({
  selector: 'app-losspass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './losspass.component.html',
  styleUrl: './losspass.component.css'
})
export class LosspassComponent implements OnInit {
  emailForm!: FormGroup;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      Swal.fire('Atención', 'Por favor ingresa un correo válido.', 'warning');
      return;
    }

    const correo = this.emailForm.value.correo;
    this.cargando = true;

    Swal.fire({
      title: 'Verificando correo...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.loginService.verificarCorreo(correo).subscribe({
      next: (res: any) => {
        Swal.close();
        this.cargando = false;

        if (res.existe) {
          // Guardar ID del usuario en localStorage
          localStorage.setItem('validacion_id', res.usuario.id);

          Swal.fire({
            icon: 'success',
            title: 'Correo enviado 📧',
            html: `
              <p>Se ha enviado un enlace de recuperación al correo:</p>
              <p class="text-indigo-700 font-semibold">${res.usuario.email}</p>
              <p class="mt-2 text-sm text-gray-500">Revisa tu bandeja de entrada o la carpeta de spam.</p>
            `,
            confirmButtonColor: '#4F46E5',
            confirmButtonText: 'Entendido',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Correo no registrado',
            text: 'El correo ingresado no está asociado a ningún usuario.',
            confirmButtonColor: '#4F46E5',
          });
        }
      },
      error: (err) => {
        Swal.close();
        this.cargando = false;
        console.error('Error al verificar correo:', err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema al verificar el correo o enviar el enlace.',
          confirmButtonColor: '#4F46E5',
        });
      },
    });
  }
}