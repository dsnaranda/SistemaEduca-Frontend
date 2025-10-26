import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { CursosService } from '../../services/server/cursos.service';
import { LoadingHelper } from '../shared/loading.helper'; 

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  ci: string;
  email: string;
  presente?: boolean;
}

@Component({
  selector: 'app-registrar-asistencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-asistencia.component.html',
  styleUrl: './registrar-asistencia.component.css',
})
export class RegistrarAsistenciaComponent implements OnInit {
  cursoId: string = '';
  curso: any = null;
  estudiantesForm!: FormGroup;
  fechaActual: string = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  constructor(
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.cursoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.cursoId) {
      this.cargarEstudiantes();
    }
  }

  get estudiantes(): FormArray {
    return this.estudiantesForm.get('estudiantes') as FormArray;
  }

cargarEstudiantes(): void {
    LoadingHelper.mostrar('Cargando estudiantes...'); // ✅

    this.cursosService.getEstudiantesPorCurso(this.cursoId).subscribe({
      next: (res: any) => {
        LoadingHelper.cerrar();

        const estudiantesOrdenados: Estudiante[] = (res.estudiantes as Estudiante[]).sort(
          (a, b) => a.apellidos.localeCompare(b.apellidos)
        );

        this.curso = res;
        this.estudiantesForm = this.fb.group({
          estudiantes: this.fb.array(
            estudiantesOrdenados.map((est) =>
              this.fb.group({
                id: [est.id],
                nombres: [est.nombres],
                apellidos: [est.apellidos],
                ci: [est.ci],
                email: [est.email],
                presente: [false],
              })
            )
          ),
        });
      },
      error: (err) => {
        LoadingHelper.cerrar();
        LoadingHelper.error('No se pudieron cargar los estudiantes.');
        console.error(err);
      },
    });
  }

  guardarAsistencia(): void {
    const estudiantes = this.estudiantes.value.map((est: Estudiante) => ({
      id: est.id,
      nombres: est.nombres,
      apellidos: est.apellidos,
      estado: est.presente ? 'Presente' : 'Ausente',
    }));

    const ausentes = estudiantes.filter((e: { estado: string }) => e.estado === 'Ausente');

    // 🔹 Previsualización antes de guardar
    const listaAusentes =
      ausentes.length > 0
        ? ausentes.map((a: Estudiante) => `• ${a.apellidos} ${a.nombres}`).join('<br>')
        : '<i>Todos los estudiantes están presentes.</i>';

    Swal.fire({
      title: '¿Deseas guardar la asistencia?',
      html: `
        <p class="text-gray-700 text-sm mb-2">Fecha: <b>${this.fechaActual}</b></p>
        <p class="text-gray-700 mb-1">Curso: <b>${this.curso?.curso ?? ''} ${this.curso?.nivel ?? ''}°${this.curso?.paralelo ?? ''}</b></p>
        <hr class="my-3">
        <p class="text-gray-700 mb-1 font-semibold">Estudiantes ausentes:</p>
        <div class="text-left text-sm text-gray-600 leading-relaxed">${listaAusentes}</div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
      width: 500,
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          curso_id: this.cursoId,
          estudiantes,
        };

        Swal.fire({
          title: 'Guardando asistencia...',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
        });

        this.cursosService.registrarAsistencia(data).subscribe({
          next: (res: any) => {
            Swal.close();
            Swal.fire('Éxito', 'Asistencia registrada correctamente.', 'success');
          },
          error: (err: any) => {
            Swal.close();
            Swal.fire('Error', 'No se pudo registrar la asistencia.', 'error');
            console.error('Error en la API:', err);
          },
        });
      }
    });
  }
}
