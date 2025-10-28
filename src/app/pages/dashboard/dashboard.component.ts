import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  usuario: any = null;
  mostrarRecordatorio = true;
  cargando = true;
  totalCursos = 0;
  totalEstudiantes = 0;
  totalFaltasSemana = 0;
  totalJustificadosSemana = 0;
  trimestresPendientes = 0;
  promediosPendientes = 0;
  asistenciaAtrasada = 0;
  cursos: any[] = [];

  constructor(private cursosService: CursosService) { }

  async ngOnInit(): Promise<void> {
    const userData = localStorage.getItem('usuario');
    if (!userData) {
      Swal.fire('Error', 'No se encontró la sesión del usuario.', 'error');
      return;
    }

    this.usuario = JSON.parse(userData);

    if (this.usuario?.rol !== 'docente') {
      Swal.fire('Acceso denegado', 'Solo los docentes pueden acceder al panel.', 'warning');
      return;
    }

    // Mostrar loader mientras carga todo
    Swal.fire({
      title: 'Cargando panel del docente...',
      text: 'Por favor, espera unos segundos.',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      background: 'rgba(255,255,255,0.95)',
      customClass: {
        title: 'text-gray-800 font-semibold',
        popup: 'rounded-2xl shadow-lg',
      },
    });

    await this.cargarDatos();

    Swal.close();
    this.cargando = false;
  }

  private async cargarDatos(): Promise<void> {
    try {
      const res = await this.cursosService.getCursosPorDocente(this.usuario.id).toPromise();

      this.cursos = res.cursos || [];
      this.totalCursos = this.cursos.length;

      this.totalEstudiantes = this.cursos.reduce(
        (acc: number, c: any) => acc + (c.total_estudiantes || 0),
        0
      );

      await this.calcularEstadisticasSemanales();
      this.calcularRecordatorios();

    } catch (err) {
      console.error('Error cargando cursos:', err);
      Swal.fire('Error', 'No se pudieron cargar los datos del docente.', 'error');
    }
  }

  cerrarRecordatorio(): void {
    this.mostrarRecordatorio = false;
  }

 
  private async calcularEstadisticasSemanales(): Promise<void> {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Lunes
    const fechasSemana: string[] = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      fechasSemana.push(fecha.toISOString().split('T')[0]);
    }

    let totalFaltas = 0;
    let totalJustificados = 0;

    for (const curso of this.cursos) {
      for (const fecha of fechasSemana) {
        try {
          const res: any = await this.cursosService
            .getAsistenciaPorFecha(curso.id || curso._id, fecha)
            .toPromise();

          const estudiantes = res.estudiantes || [];
          totalFaltas += estudiantes.filter((e: any) => e.estado === 'Ausente').length;
          totalJustificados += estudiantes.filter((e: any) => e.estado === 'Justificado').length;
        } catch {
          // No hace nada si no hay asistencia ese día
        }
      }
    }

    this.totalFaltasSemana = totalFaltas;
    this.totalJustificadosSemana = totalJustificados;
  }

  /**
   * 🔹 Calcula recordatorios básicos
   */
  private calcularRecordatorios(): void {
    this.trimestresPendientes = Math.floor(this.totalCursos / 2);
    this.promediosPendientes = this.cursos.filter(
      (c) => !c.notas_finales || c.notas_finales.length === 0
    ).length;
    this.asistenciaAtrasada = Math.floor(this.totalCursos / 3);
  }
}
