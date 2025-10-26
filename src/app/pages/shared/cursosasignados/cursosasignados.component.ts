import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CursosService } from '../../../services/server/cursos.service';
import { LoadingHelper } from '../loading.helper';
@Component({
  selector: 'app-cursosasignados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursosasignados.component.html',
  styleUrl: './cursosasignados.component.css'
})
export class CursosasignadosComponent implements OnInit {
  cursos: any[] = [];
  docenteId = '';
  contexto: 'home' | 'asistencia' = 'home';
  noCursos: any;

  constructor(private cursosService: CursosService, private router: Router) {}

  ngOnInit(): void {
    // Detecta desde qué ruta fue llamado
    if (this.router.url.includes('asistencia')) {
      this.contexto = 'asistencia';
    } else {
      this.contexto = 'home';
    }

    // Cargar cursos del docente
    const data = localStorage.getItem('usuario');
    if (data) {
      const usuario = JSON.parse(data);
      this.docenteId = usuario.id;
      this.cargarCursos();
    }
  }

  cargarCursos(): void {
    // Mostrar loader al iniciar la carga
    LoadingHelper.mostrar('Cargando cursos asignados...');

    this.cursosService.getCursosPorDocente(this.docenteId).subscribe({
      next: (res) => {
        // Cerrar loader al recibir respuesta
        LoadingHelper.cerrar();

        this.cursos = res.cursos || [];
        localStorage.setItem('cursosDocente', JSON.stringify(this.cursos));
        console.log('Cursos cargados y guardados en localStorage:', this.cursos);
      },
      error: (err) => {
        // Cerrar loader y mostrar error si algo falla
        LoadingHelper.cerrar();
        LoadingHelper.error('No se pudieron obtener los cursos.');
        console.error('Error al obtener cursos:', err);
      }
    });
  }

  abrirCurso(id: string): void {
    if (this.contexto === 'home') {
      // En "home", redirige a materias del curso
      this.router.navigate(['/materias', id]);
    } else if (this.contexto === 'asistencia') {
      // En "asistencia", redirige a registrar asistencia
      this.router.navigate(['/asistencia/registrar', id]);
    }
  }
}