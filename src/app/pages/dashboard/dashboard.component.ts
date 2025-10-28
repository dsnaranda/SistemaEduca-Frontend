import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { RouterModule } from "@angular/router";
import { CursosService } from '../../services/server/cursos.service';
import { MateriasService } from '../../services/server/materias.service';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  cursos: any[] = [];
  totalCursos = 0;
  totalEstudiantes = 0;
  totalFaltasSemana = 0;
  totalJustificadosSemana = 0;
  totalPresentesSemana = 0;
  trimestresPendientes = 0;
  promediosPendientes = 0;
  mostrarRecordatorio = true;
  chart: any;
  cartillasDocente: any[] = []; 

  constructor(
    private cursosService: CursosService,
    private materiasService: MateriasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    Swal.fire({
      title: 'Cargando datos del dashboard...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const docente = JSON.parse(localStorage.getItem('usuario') || '{}');
      const docenteId = docente._id || docente.id;
      if (!docenteId) throw new Error('No se encontró el docente en localStorage');

      const cursosRes: any = await this.cursosService.getCursosPorDocente(docenteId).toPromise();
      this.cursos = cursosRes.cursos || [];
      this.totalCursos = this.cursos.length;
      this.totalEstudiantes = this.cursos.reduce((acc, c) => acc + (c.total_estudiantes || 0), 0);

      await this.calcularAsistenciasSemana();
      await this.calcularRecordatorios();
      await this.cargarCartillasDocente();

      Swal.close();
      this.generarGrafico();
    } catch (err) {
      Swal.close();
      console.error('Error cargando dashboard:', err);
      Swal.fire('Error', 'No se pudieron cargar los datos del dashboard.', 'error');
    }
  }

  async cargarCartillasDocente(): Promise<void> {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.trim().toLowerCase();

      const todos = await this.cursosService.getTodosLosCursos().toPromise();
      const cursosDocente = todos.cursos.filter(
        (c: any) => c.docente?.trim().toLowerCase() === nombreCompleto
      );

      const resultados: any[] = [];

      for (const curso of cursosDocente) {
        try {
          const cartilla = await this.materiasService.getCartillaCurso(curso.id).toPromise();
          resultados.push({
            curso: `${curso.nombre} (${curso.nivel}°${curso.paralelo})`,
            total_estudiantes: cartilla.total_estudiantes,
            detalle: cartilla.cartilla,
          });
        } catch { }
      }

      this.cartillasDocente = resultados;
      this.calcularResumenCartillas(); 
    } catch (err) {
      console.error('Error al cargar cartillas:', err);
    }
  }

  async calcularAsistenciasSemana(): Promise<void> {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const fechas = Array.from({ length: 7 }, (_, i) => {
      const f = new Date(inicioSemana);
      f.setDate(inicioSemana.getDate() + i);
      return f.toISOString().split('T')[0];
    });

    let presentes = 0, ausentes = 0, justificados = 0;

    for (const curso of this.cursos) {
      for (const fecha of fechas) {
        try {
          const res: any = await this.cursosService.getAsistenciaPorFecha(curso.id, fecha).toPromise();
          if (res && res.estudiantes) {
            res.estudiantes.forEach((e: any) => {
              if (e.estado === 'Presente') presentes++;
              else if (e.estado === 'Ausente') ausentes++;
              else if (e.estado === 'Justificado') justificados++;
            });
          }
        } catch { }
      }
    }

    this.totalFaltasSemana = ausentes;
    this.totalJustificadosSemana = justificados;
    this.totalPresentesSemana = presentes;
  }

  generarGrafico(): void {
    const ctx = document.getElementById('donaAsistencia') as HTMLCanvasElement;
    if (this.chart) this.chart.destroy();

    const total = this.totalPresentesSemana + this.totalFaltasSemana + this.totalJustificadosSemana;
    const data = total > 0
      ? [
        (this.totalPresentesSemana / total) * 100,
        (this.totalFaltasSemana / total) * 100,
        (this.totalJustificadosSemana / total) * 100,
      ]
      : [0, 0, 0];

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Presente', 'Ausente', 'Justificado'],
        datasets: [
          {
            data,
            backgroundColor: ['#4F46E5', '#EF4444', '#FACC15'],
            hoverOffset: 10,
          },
        ],
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
            },
          },
        },
      },
    });
  }

  private calcularRecordatorios(): void {
    this.trimestresPendientes = Math.floor(this.totalCursos / 2);
    this.promediosPendientes = this.cursos.filter(
      (c) => !c.notas_finales || c.notas_finales.length === 0
    ).length;
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  cerrarRecordatorio(): void {
    this.mostrarRecordatorio = false;
  }

  promedioGeneral = 0;
  mejorCurso: any = null;
  mejorEstudiante: any = null;


  calcularResumenCartillas(): void {
    const todasCartillas = this.cartillasDocente.flatMap((c: any) => c.detalle);

    if (!todasCartillas.length) return;

    // Promedio general
    const promedios = todasCartillas.map((e: any) => e.promedio_curso);
    this.promedioGeneral = promedios.reduce((a: number, b: number) => a + b, 0) / promedios.length;

    // Mejor curso
    const cursoPromedios = this.cartillasDocente.map((c: any) => ({
      curso: c.curso,
      promedio: c.detalle.reduce((a: number, b: any) => a + b.promedio_curso, 0) / c.detalle.length
    }));
    this.mejorCurso = cursoPromedios.sort((a: any, b: any) => b.promedio - a.promedio)[0];

    // Mejor estudiante
    const mejorEst = todasCartillas.sort((a: any, b: any) => b.promedio_curso - a.promedio_curso)[0];
    this.mejorEstudiante = {
      nombre: `${mejorEst.nombres} ${mejorEst.apellidos}`,
      promedio: mejorEst.promedio_curso
    };

    // Gráficos
    this.generarGraficoEstados(todasCartillas);
    this.generarGraficoMaterias(todasCartillas);
  }


  generarGraficoEstados(cartillas: any[]): void {
    const aprobados = cartillas.filter(c => c.estado === 'Aprobado').length;
    const reprobados = cartillas.filter(c => c.estado === 'Reprobado').length;

    const ctx = document.getElementById('graficoEstados') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Aprobado', 'Reprobado'],
        datasets: [{
          data: [aprobados, reprobados],
          backgroundColor: ['#4CAF50', '#EF4444']
        }]
      },
      options: { cutout: '70%' }
    });
  }

  generarGraficoMaterias(cartillas: any[]): void {
    const promediosPorMateria: Record<string, number[]> = {};

    cartillas.forEach(e => {
      e.detalle_materias.forEach((m: any) => {
        if (!promediosPorMateria[m.materia_nombre]) promediosPorMateria[m.materia_nombre] = [];
        promediosPorMateria[m.materia_nombre].push(m.promedio_materia);
      });
    });

    const materias = Object.keys(promediosPorMateria);
    const promedios = materias.map(
      m => promediosPorMateria[m].reduce((a, b) => a + b, 0) / promediosPorMateria[m].length
    );

    const ctx = document.getElementById('graficoMaterias') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: materias,
        datasets: [{
          label: 'Promedio',
          data: promedios,
          backgroundColor: '#4F46E5'
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, max: 10 } }
      }
    });
  }

}
