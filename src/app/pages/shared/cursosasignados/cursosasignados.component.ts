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
  usuario: any = null;
  contexto: 'home' | 'asistencia' = 'home';
  noCursos: any;

  constructor(private cursosService: CursosService, private router: Router) { }

  ngOnInit(): void {
    // Detecta desde qué ruta fue llamado
    if (this.router.url.includes('asistencia')) {
      this.contexto = 'asistencia';
    } else {
      this.contexto = 'home';
    }

    // Obtener usuario desde localStorage
    const data = localStorage.getItem('usuario');
    if (data) {
      this.usuario = JSON.parse(data);
      this.cargarCursosSegunRol();
    } else {
      console.warn('No se encontró información del usuario en localStorage');
    }
  }

  cargarCursosSegunRol(): void {
    if (!this.usuario) return;

    LoadingHelper.mostrar('Cargando cursos asignados...');

    const rol = this.usuario.rol;
    const id = this.usuario.id;

    if (rol === 'docente') {
      this.cursosService.getCursosPorDocente(id).subscribe({
        next: (res) => {
          LoadingHelper.cerrar();
          this.cursos = res.cursos || [];
          localStorage.setItem('cursosDocente', JSON.stringify(this.cursos));
          console.log('Cursos del docente cargados:', this.cursos);
        },
        error: (err) => {
          LoadingHelper.cerrar();
          LoadingHelper.error('No se pudieron obtener los cursos del docente.');
          console.error(err);
        }
      });
    } else if (rol === 'estudiante') {
      this.cursosService.getCursosPorEstudiante(id).subscribe({
        next: (res) => {
          LoadingHelper.cerrar();
          this.cursos = res.cursos || [];
          console.log('Cursos del estudiante cargados:', this.cursos);
        },
        error: (err) => {
          LoadingHelper.cerrar();
          LoadingHelper.error('No se pudieron obtener los cursos del estudiante.');
          console.error(err);
        }
      });
    } else {
      LoadingHelper.cerrar();
      console.warn('Rol no reconocido:', rol);
    }
  }

  goCusos(): void {
    this.router.navigate(['/addcursos']);
  }

  abrirCurso(id: string): void {
    if (this.usuario?.rol === 'estudiante') {
      // Si es estudiante, lo redirigimos a ver sus materias (no asistencia)
      this.router.navigate(['/materias', id]);
      return;
    }

    if (this.contexto === 'home') {
      this.router.navigate(['/materias', id]);
    } else if (this.contexto === 'asistencia') {
      this.router.navigate(['/asistencia/registrar', id]);
    }
  }

}
