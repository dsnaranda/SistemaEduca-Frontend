import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CursosService } from '../../../services/server/cursos.service';

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

  constructor(private cursosService: CursosService, private router: Router) { }

  ngOnInit(): void {
    // Detecta desde qué ruta fue llamado
    if (this.router.url.includes('asistencia')) {
      this.contexto = 'asistencia';
    } else {
      this.contexto = 'home';
    }

    // Cargar cursos
    const data = localStorage.getItem('usuario');
    if (data) {
      const usuario = JSON.parse(data);
      this.docenteId = usuario.id;
      this.cargarCursos();
    }
  }

  cargarCursos(): void {
    this.cursosService.getCursosPorDocente(this.docenteId).subscribe({
      next: (res) => (this.cursos = res.cursos || []),
      error: (err) => console.error('Error al obtener cursos:', err)
    });
  }

  abrirCurso(id: string): void {
    if (this.contexto === 'home') {
      this.router.navigate(['/curso', id]);
    } else if (this.contexto === 'asistencia') {
      this.router.navigate(['/asistencia/registrar', id]);
    }
  }

}