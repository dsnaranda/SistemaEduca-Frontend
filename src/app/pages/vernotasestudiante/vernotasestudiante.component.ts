import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { CursosService } from '../../services/server/cursos.service';
import Swal from 'sweetalert2';
import { MateriasService } from '../../services/server/materias.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vernotasestudiante',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './vernotasestudiante.component.html',
  styleUrl: './vernotasestudiante.component.css'
})
export class VernotasestudianteComponent implements OnInit {

  usuario: any = null;
  cursos: any[] = [];
  cursoSeleccionado: any = null;
  cartilla: any[] = [];
  cargando = false;
  error = '';
  expandido: string | null = null;
  ordenActual: string = 'apellidos';
  ordenAscendente: boolean = true;

  constructor(
    private cursosService: CursosService,
    private materiasService: MateriasService
  ) { }

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) this.usuario = JSON.parse(data);

    if (this.usuario?.rol === 'estudiante') {
      this.cargarCursos();
    } else {
      this.error = 'Usuario no autorizado.';
    }
  }

  cargarCursos(): void {
    if (!this.usuario) return;

    Swal.fire({
      title: 'Cargando cursos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const { id } = this.usuario;

    this.cursosService.getCursosPorEstudiante(id).subscribe({
      next: (res) => {
        Swal.close();
        this.cursos = res.cursos || [];
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        this.error = 'Error al cargar cursos.';
      }
    });
  }

  verCartilla(cursoId: string): void {
    this.cursoSeleccionado = this.cursos.find(c => c.id === cursoId || c._id === cursoId);
    if (!this.cursoSeleccionado) return;

    Swal.fire({
      title: 'Cargando cartilla...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.cargando = true;
    this.cartilla = [];

    this.materiasService.getCartillaCurso(cursoId).subscribe({
      next: (res) => {
        Swal.close();
        this.cargando = false;

        // primero duplica el llenado completo como en CalificacionesComponent
        const cartillaCompleta = (res.cartilla || []).sort((a: any, b: any) =>
          a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' })
        );

        // luego aplica el filtro por el id del estudiante logeado
        const estudianteId = this.usuario.id;
        this.cartilla = cartillaCompleta.filter(
          (est: any) => est.estudiante_id === estudianteId
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

  toggleExpand(id: string): void {
    this.expandido = this.expandido === id ? null : id;
  }

  irAtras(): void {
    this.cursoSeleccionado = null;
    this.cartilla = [];
    this.expandido = null;
  }

  ordenarPor(campo: string): void {
    if (this.ordenActual === campo) {
      this.ordenAscendente = !this.ordenAscendente;
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