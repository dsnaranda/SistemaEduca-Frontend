import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { CursosService } from '../../services/server/cursos.service';
import { MateriasService } from '../../services/server/materias.service';
import { LoadingHelper } from '../shared/loading.helper';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [NavbarComponent, CommonModule, RouterModule],
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.css'
})
export class CalificacionesComponent implements OnInit {
  cursos: any[] = [];
  cursoSeleccionado: any = null;
  cartilla: any[] = [];
  cargando = false;
  error = '';
  expandido: string | null = null;
  usuario: any = null;
  ordenActual: string = 'apellidos';
  ordenAscendente: boolean = true;

  constructor(
    private cursosService: CursosService,
    private materiasService: MateriasService
  ) { }

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      this.usuario = JSON.parse(data);
      this.cargarCursos();
    }
  }

  // 🔹 Cargar cursos del docente o estudiante
  cargarCursos(): void {
    if (!this.usuario) return;

    LoadingHelper.mostrar('Cargando cursos...');
    const { rol, id } = this.usuario;

    const obs =
      rol === 'docente'
        ? this.cursosService.getCursosPorDocente(id)
        : this.cursosService.getCursosPorEstudiante(id);

    obs.subscribe({
      next: (res) => {
        LoadingHelper.cerrar();
        this.cursos = res.cursos || [];
      },
      error: () => {
        LoadingHelper.cerrar();
        this.error = 'Error al obtener los cursos.';
      }
    });
  }

  // 🔹 Ver la cartilla final del curso
  verCartilla(cursoId: string): void {
    this.cursoSeleccionado = this.cursos.find(c => c.id === cursoId || c._id === cursoId);
    if (!this.cursoSeleccionado) return;

    Swal.fire({
      title: 'Cargando cartilla...',
      text: 'Por favor espera unos segundos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.cargando = true;
    this.error = '';
    this.cartilla = [];

    this.materiasService.getCartillaCurso(cursoId).subscribe({
      next: (res) => {
        Swal.close();
        this.cargando = false;

        // Ordenar por apellidos (A–Z)
        this.cartilla = (res.cartilla || []).sort((a: any, b: any) =>
          a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' })
        );
      },
      error: (err) => {
        Swal.close();
        this.cargando = false;
        this.error = 'Error al cargar cartilla.';
        console.error(err);
      }
    });
  }

  // 🔹 Alternar vista de detalles
  toggleExpand(id: string): void {
    this.expandido = this.expandido === id ? null : id;
  }

  // 🔹 Volver a la lista de cursos
  irAtras(): void {
    this.cursoSeleccionado = null;
    this.cartilla = [];
    this.expandido = null;
  }

  // 🔹 Reordenar la tabla al hacer clic en el encabezado
  ordenarPor(campo: string): void {
    if (this.ordenActual === campo) {
      this.ordenAscendente = !this.ordenAscendente; // alternar entre asc/desc
    } else {
      this.ordenActual = campo;
      this.ordenAscendente = true;
    }

    this.cartilla.sort((a, b) => {
      const valorA = (a[campo] || '').toLowerCase();
      const valorB = (b[campo] || '').toLowerCase();
      const comparacion = valorA.localeCompare(valorB, 'es', { sensitivity: 'base' });
      return this.ordenAscendente ? comparacion : -comparacion;
    });
  }
}
