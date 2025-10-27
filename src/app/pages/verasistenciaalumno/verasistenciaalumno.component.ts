import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { CursosService } from '../../services/server/cursos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verasistenciaalumno',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './verasistenciaalumno.component.html',
  styleUrl: './verasistenciaalumno.component.css'
})
export class VerasistenciaalumnoComponent implements OnInit {
  cursos: any[] = [];
  cursoSeleccionado: any = null;
  estudianteId!: string;

  cargando = false;
  historial: any[] = [];
  resumen: any = null;

  constructor(private cursosService: CursosService) { }

  ngOnInit(): void {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const parsed = JSON.parse(usuario);
      this.estudianteId = parsed.id;
    }

    if (!this.estudianteId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el usuario actual.',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cargando = true;

    Swal.fire({
      title: 'Cargando cursos...',
      text: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursosService.getCursosPorEstudiante(this.estudianteId).subscribe({
      next: (res: any) => {
        Swal.close();
        this.cursos = res?.cursos || res || [];
        this.cargando = false;
      },
      error: () => {
        Swal.close();
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los cursos del estudiante.',
          confirmButtonColor: '#4F46E5'
        });
      }
    });
  }

  // ✅ Nuevo método que llama al endpoint optimizado
  verAsistencia(cursoId: string): void {
    this.cursoSeleccionado = this.cursos.find(c => c.id === cursoId || c._id === cursoId);
    this.cargando = true;
    this.historial = [];
    this.resumen = null;

    Swal.fire({
      title: 'Cargando historial...',
      text: 'Estamos obteniendo los registros de asistencia.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.cursosService.getHistorialAsistencia(cursoId, this.estudianteId).subscribe({
      next: (res: any) => {
        Swal.close();
        this.cargando = false;
        this.historial = res?.historial || [];
        this.resumen = {
          curso: res?.curso,
          estudiante: res?.estudiante,
          total: res?.total_registros || 0,
          presentes: res?.total_presentes || 0,
          ausentes: res?.total_ausentes || 0,
          justificados: res?.total_justificados || 0
        };
      },
      error: () => {
        Swal.close();
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener el historial de asistencia.',
          confirmButtonColor: '#DC2626'
        });
      }
    });
  }

  irAtras(): void {
    this.cursoSeleccionado = null;
    this.historial = [];
    this.resumen = null;
  }
}
