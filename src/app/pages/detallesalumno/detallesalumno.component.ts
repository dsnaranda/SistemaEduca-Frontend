import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import Swal from 'sweetalert2';
import { MateriasService } from '../../services/server/materias.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-detallesalumno',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './detallesalumno.component.html',
  styleUrl: './detallesalumno.component.css'
})
export class DetallesalumnoComponent implements OnInit {
  materiaId!: string;
  numeroTrimestre!: number;
  estudianteId!: string;

  data: any = null;
  detalleTrimestre: any = null;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService
  ) { }

  ngOnInit(): void {
    this.materiaId = this.route.snapshot.paramMap.get('id')!;
    this.numeroTrimestre = Number(this.route.snapshot.paramMap.get('numero'));

    // Obtener el estudiante actual del localStorage
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const parsed = JSON.parse(usuario);
      this.estudianteId = parsed.id;
    }

    if (!this.estudianteId) {
      Swal.fire({
        icon: 'error',
        title: 'Usuario no identificado',
        text: 'No se pudo cargar la información del estudiante.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    // ✅ Mostrar el ID del estudiante que está revisando
    console.log('👤 ID del estudiante actual:', this.estudianteId);

    this.mostrarCargando();
    this.cargarDatosEstudiante();
  }

  mostrarCargando(): void {
    Swal.fire({
      title: 'Cargando tus calificaciones...',
      text: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  }

  cargarDatosEstudiante(): void {
    // Paso 1: Obtener lista de estudiantes del trimestre
    this.materiasService.getEstudiantesPorTrimestre(this.materiaId, this.numeroTrimestre).subscribe({
      next: (res) => {
        this.data = res;
        const estudiante = res.estudiantes.find((e: any) => e.estudiante_id === this.estudianteId);

        if (!estudiante) {
          Swal.close();
          this.cargando = false;
          this.error = 'No se encontraron calificaciones asociadas a tu usuario.';
          return;
        }

        // ✅ Consola: mostrar IDs de estudiante y trimestre
        console.log('📘 Trimestre que está revisando:', this.numeroTrimestre);
        console.log('🧾 ID del trimestre del estudiante:', estudiante.trimestre_id);

        // Paso 2: Obtener los detalles de su trimestre
        this.materiasService.getTrimestrePorId(estudiante.trimestre_id).subscribe({
          next: (detalle) => {
            this.detalleTrimestre = detalle;
            this.cargando = false;
            Swal.close();
          },
          error: (err) => {
            console.error('Error al obtener detalle del trimestre:', err);
            this.cargando = false;
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Error al cargar notas',
              text: 'No se pudo obtener el detalle de tus calificaciones.',
              confirmButtonColor: '#4f46e5'
            });
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar estudiantes:', err);
        this.cargando = false;
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar tus calificaciones. Intenta nuevamente.',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  }
}