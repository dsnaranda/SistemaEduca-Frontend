import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CursosService } from '../../services/server/cursos.service';
import { LoadingHelper } from '../shared/loading.helper';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-registrar-asistencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registrar-asistencia.component.html',
  styleUrl: './registrar-asistencia.component.css',
})
export class RegistrarAsistenciaComponent implements OnInit {
  cursoId: string = '';
  curso: any = null;
  estudiantesForm!: FormGroup;
  estudiantesOriginal: any[] = [];
  filtroEstado: string = 'Todos';
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];

  modoJustificar: boolean = false;
  modoAnalitico: boolean = false;
  filtroTiempo: string = 'dia'; // dia | semana | mes

  constructor(
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cursoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.cursoId) {
      this.cargarAsistenciaPorFecha();
    }
  }

  get estudiantes(): FormArray {
    return this.estudiantesForm.get('estudiantes') as FormArray;
  }

  // CARGAR ASISTENCIA NORMAL POR FECHA
  cargarAsistenciaPorFecha(): void {
    LoadingHelper.mostrar('Cargando asistencia...');

    this.cursosService.getAsistenciaPorFecha(this.cursoId, this.fechaSeleccionada).subscribe({
      next: (res: any) => {
        LoadingHelper.cerrar();
        this.curso = {
          curso: res.curso || 'Curso desconocido',
          nivel: res.nivel || '',
          paralelo: res.paralelo || ''
        };

        this.estudiantesOriginal = res.estudiantes;

        this.estudiantesForm = this.fb.group({
          estudiantes: this.fb.array(
            res.estudiantes.map((est: any) =>
              this.fb.group({
                id: [est.id],
                nombres: [est.nombres],
                apellidos: [est.apellidos],
                presente: [est.estado === 'Presente'],
                estado: [est.estado || null],
                justificar: [false]   // Añadimos este campo SIEMPRE
              })
            )
          ),
        });

      },
      error: (err) => {
        LoadingHelper.cerrar();
        LoadingHelper.error('No se pudo cargar la asistencia.');
        console.error(err);
      },
    });
  }

  // ACTUALIZAR ESTADO EN TIEMPO REAL
  actualizarEstado(control: any): void {
    const est = control as FormGroup;
    est.patchValue({
      estado: est.value.presente ? 'Presente' : 'Ausente',
    });
  }

  // FILTRO NORMAL POR ESTADO
  aplicarFiltro(): void {
    if (this.filtroEstado === 'Todos') {
      this.setEstudiantes(this.estudiantesOriginal);
    } else {
      const filtrados = this.estudiantesOriginal.filter(
        (e) => e.estado === this.filtroEstado
      );
      this.setEstudiantes(filtrados);
    }
  }

  private setEstudiantes(lista: any[]): void {
    this.estudiantesForm.setControl(
      'estudiantes',
      this.fb.array(
        lista.map((est) =>
          this.fb.group({
            id: [est.id],
            nombres: [est.nombres],
            apellidos: [est.apellidos],
            presente: [est.estado === 'Presente'],
            estado: [est.estado || null],
            justificar: [false]
          })
        )
      )
    );
  }

  // MODO ANALÍTICO DE JUSTIFICACIÓN 
  activarModoJustificar(): void {
    Swal.fire({
      title: 'Selecciona un rango de tiempo',
      input: 'select',
      inputOptions: {
        dia: 'Día actual',
        semana: 'Semana actual',
        mes: 'Mes actual',
      },
      inputValue: 'semana',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#4F46E5',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.modoAnalitico = true;
      this.modoJustificar = true;
      this.filtroTiempo = result.value;
      this.cargarFaltasAnaliticas();
    });
  }

  cancelarJustificacion(): void {
    this.modoAnalitico = false;
    this.modoJustificar = false;
    this.cargarAsistenciaPorFecha();
  }

  // Calcular fechas del rango (día, semana, mes)
  private obtenerFechasRango(): string[] {
    const hoy = new Date();
    const fechas: string[] = [];

    if (this.filtroTiempo === 'dia') {
      fechas.push(this.fechaSeleccionada);
    } else if (this.filtroTiempo === 'semana') {
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - hoy.getDay());
      for (let i = 0; i < 7; i++) {
        const f = new Date(inicio);
        f.setDate(inicio.getDate() + i);
        fechas.push(f.toISOString().split('T')[0]);
      }
    } else if (this.filtroTiempo === 'mes') {
      const año = hoy.getFullYear();
      const mes = hoy.getMonth();
      const diasEnMes = new Date(año, mes + 1, 0).getDate();
      for (let d = 1; d <= diasEnMes; d++) {
        const f = new Date(año, mes, d);
        fechas.push(f.toISOString().split('T')[0]);
      }
    }

    return fechas;
  }

  // Obtener todas las faltas sin tocar backend
  async cargarFaltasAnaliticas(): Promise<void> {
    LoadingHelper.mostrar('Cargando faltas...');
    const fechas = this.obtenerFechasRango();
    const faltas: any[] = [];

    for (const fecha of fechas) {
      try {
        const res: any = await this.cursosService
          .getAsistenciaPorFecha(this.cursoId, fecha)
          .toPromise();

        res.estudiantes
          .filter((e: any) => e.estado === 'Ausente')
          .forEach((e: any) => faltas.push({ ...e, fecha }));
      } catch (err) {
        console.warn('Error obteniendo fecha', fecha, err);
      }
    }

    LoadingHelper.cerrar();

    if (faltas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin faltas',
        text: 'No se encontraron ausencias en este rango.',
        confirmButtonColor: '#4F46E5',
      });
      return;
    }

    this.estudiantesOriginal = faltas;
    this.estudiantesForm = this.fb.group({
      estudiantes: this.fb.array(
        faltas.map((est: any) =>
          this.fb.group({
            id: [est.id],
            nombres: [est.nombres],
            apellidos: [est.apellidos],
            estado: [est.estado],
            fecha: [est.fecha],
            justificar: [false]
          })
        )
      ),
    });

  }

  // Confirmar la justificación
  confirmarJustificacion(): void {
    const seleccionados = this.estudiantes.value.filter((e: any) => e.justificar);

    if (seleccionados.length === 0) {
      Swal.fire('Atención', 'Debes seleccionar al menos una falta para justificar.', 'info');
      return;
    }

    // No permitir justificar presentes
    const hayPresentes = seleccionados.some((e: any) => e.estado === 'Presente');
    if (hayPresentes) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción no permitida',
        text: 'No puedes justificar a estudiantes con estado "Presente".',
        confirmButtonColor: '#F59E0B',
      });
      return;
    }

    // Agrupar por fecha (una solicitud por cada día)
    const gruposPorFecha: Record<string, { id: string; estado: 'Justificado' }[]> = {};
    seleccionados.forEach((e: any) => {
      // Normaliza fecha a YYYY-MM-DD por si llega con hora
      const fecha = (e.fecha || '').toString().slice(0, 10);
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
      if (!gruposPorFecha[fecha]) gruposPorFecha[fecha] = [];
      gruposPorFecha[fecha].push({ id: e.id, estado: 'Justificado' });
    });

    const fechas = Object.keys(gruposPorFecha);
    if (fechas.length === 0) {
      Swal.fire('Atención', 'No se detectaron fechas válidas para justificar.', 'info');
      return;
    }

    LoadingHelper.mostrar('Justificando faltas...');

    // Construimos las peticiones (una por fecha)
    const peticiones = fechas.map((fecha) =>
      this.cursosService
        .actualizarAsistencia({
          curso_id: this.cursoId,
          fecha,
          estudiantes: gruposPorFecha[fecha],
        })
        .pipe(
          catchError((err) => {
            // Capturamos error de esta fecha, pero seguimos con las demás
            console.error('Error al justificar fecha', fecha, err);
            return of({ _error: true, fecha, err });
          })
        )
    );

    forkJoin(peticiones).subscribe((resultados: any[]) => {
      LoadingHelper.cerrar();

      const errores = resultados.filter((r) => r && r._error);
      const okCount = resultados.length - errores.length;
      const total = resultados.length;

      if (okCount > 0 && errores.length === 0) {
        Swal.fire({
          icon: 'success',
          title: 'Faltas justificadas',
          text: `Se justificaron ${seleccionados.length} faltas en ${total} fecha(s).`,
          confirmButtonColor: '#10B981',
        }).then(() => {
          this.modoAnalitico = false;
          this.modoJustificar = false;
          this.cargarAsistenciaPorFecha();
        });
      } else if (okCount > 0 && errores.length > 0) {
        const detalle = errores
          .map((e) => `• ${e.fecha}: ${e.err?.error?.mensaje || e.err?.error?.error || 'Error'}`)
          .join('<br>');
        Swal.fire({
          icon: 'warning',
          title: 'Parcialmente justificado',
          html: `Éxitos: <b>${okCount}</b> / ${total}.<br><br>${detalle}`,
          confirmButtonColor: '#F59E0B',
        }).then(() => this.cargarAsistenciaPorFecha());
      } else {
        const detalle = errores
          .map((e) => `• ${e.fecha}: ${e.err?.error?.mensaje || e.err?.error?.error || 'Error'}`)
          .join('<br>');
        Swal.fire({
          icon: 'error',
          title: 'Error al justificar',
          html: detalle || 'No se pudieron justificar las faltas.',
          confirmButtonColor: '#DC2626',
        }).then(() => this.cargarAsistenciaPorFecha());
      }
    });
  }

  // GUARDAR ASISTENCIA NORMAL
  guardarAsistencia(): void {
    const estudiantes = this.estudiantes.value.map((est: any) => ({
      id: est.id,
      nombres: est.nombres,
      apellidos: est.apellidos,
      estado: est.presente ? 'Presente' : 'Ausente',
    }));

    const data = {
      curso_id: this.cursoId,
      fecha: this.fechaSeleccionada,
      estudiantes,
    };

    Swal.fire({
      title: '¿Guardar asistencia?',
      html: `Fecha seleccionada: <b>${this.fechaSeleccionada}</b>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280',
    }).then((result) => {
      if (!result.isConfirmed) return;

      LoadingHelper.mostrar('Guardando asistencia...');

      this.cursosService.registrarAsistencia(data).subscribe({
        next: (res: any) => {
          LoadingHelper.cerrar();
          const mensajeOk = res?.mensaje || 'Asistencia guardada correctamente.';
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: mensajeOk,
            confirmButtonColor: '#4F46E5',
          }).then(() => this.cargarAsistenciaPorFecha());
        },
        error: (err: any) => {
          LoadingHelper.cerrar();

          const msg =
            err?.error?.mensaje ||
            err?.error?.error ||
            'No se pudo registrar la asistencia.';

          // Si ya existe el registro
          if (msg.toLowerCase().includes('ya está registrada')) {
            Swal.fire({
              icon: 'warning',
              title: 'Atención',
              text: msg,
              confirmButtonColor: '#F59E0B',
            }).then(() => this.cargarAsistenciaPorFecha());
          }
          // Error genérico
          else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: msg,
              confirmButtonColor: '#DC2626',
            }).then(() => this.cargarAsistenciaPorFecha());
          }
        },
      });
    });
  }

  irAtras(): void {
    this.router.navigate(['/asistencia']);
  }

}
