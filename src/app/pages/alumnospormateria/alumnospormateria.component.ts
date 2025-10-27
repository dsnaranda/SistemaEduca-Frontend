import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { MateriasService } from '../../services/server/materias.service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-alumnospormateria',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './alumnospormateria.component.html',
  styleUrl: './alumnospormateria.component.css'
})
export class AlumnospormateriaComponent implements OnInit {
  materiaId!: string;
  numeroTrimestre!: number;
  data: any = null;
  cargando = true;
  error = '';
  mostrarModal = false;
  trimestreExpandido: string | null = null;
  detallesTrimestre: any = {};
  notas: { [actividadId: string]: number } = {};
  edicionActiva: { [actividadId: string]: boolean } = {};


  nuevaTarea = {
    parametro: '',
    nombre: '',
    descripcion: ''
  };

  parametrosDisponibles = [
    'Lecciones',
    'Actividad intraclases',
    'Tareas',
    'Exposiciones',
    'Talleres',
    'Evaluación del periodo',
    'Proyecto interdisciplinar'
  ];

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.materiaId = this.route.snapshot.paramMap.get('id')!;
    this.numeroTrimestre = Number(this.route.snapshot.paramMap.get('numero'));
    this.mostrarCargando();
    this.cargarEstudiantes();
  }

  mostrarCargando(): void {
    Swal.fire({
      title: 'Cargando estudiantes...',
      text: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  abrirModal(): void {
    this.nuevaTarea = { parametro: '', nombre: '', descripcion: '' };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  habilitarEdicion(actividadId: string): void {
    this.edicionActiva[actividadId] = true;
  }

  cargarEstudiantes(): void {
    this.materiasService.getEstudiantesPorTrimestre(this.materiaId, this.numeroTrimestre).subscribe({
      next: (res) => {
        res.estudiantes.sort((a: any, b: any) => {
          const nombreA = (a.apellidos + a.nombres).toLowerCase();
          const nombreB = (b.apellidos + b.nombres).toLowerCase();
          return nombreA.localeCompare(nombreB);
        });

        this.data = res;
        this.cargando = false;
        Swal.close();
      },
      error: (err) => {
        console.error('Error al cargar estudiantes:', err);
        this.error = 'No se pudieron cargar los estudiantes.';
        this.cargando = false;
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los estudiantes. Intenta nuevamente.',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  }

  verDetalles(trimestreId: string): void {
    // Si ya está abierto, colapsa
    if (this.trimestreExpandido === trimestreId) {
      this.trimestreExpandido = null;
      return;
    }

    // Mostrar detalles si es otro trimestre
    this.trimestreExpandido = trimestreId;
    this.detallesTrimestre[trimestreId] = null;

    this.materiasService.getTrimestrePorId(trimestreId).subscribe({
      next: (res) => {
        this.detallesTrimestre[trimestreId] = res;
      },
      error: (err) => {
        console.error('Error al obtener detalles del trimestre:', err);
        Swal.fire('Error', 'No se pudieron cargar los detalles del trimestre.', 'error');
      }
    });
  }

  enviarTarea(): void {
    if (!this.nuevaTarea.parametro || !this.nuevaTarea.nombre || !this.nuevaTarea.descripcion) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos antes de enviar.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Una vez enviada, la tarea no se podrá eliminar.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar tarea',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Enviando tarea...',
        text: 'Por favor espera unos segundos.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const payload = {
        materia_id: this.materiaId,
        parametro: this.nuevaTarea.parametro,
        nombre: this.nuevaTarea.nombre,
        descripcion: this.nuevaTarea.descripcion,
        nota: null,
        numero_trimestre: this.numeroTrimestre
      };

      this.materiasService.enviarTarea(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Tarea enviada',
            text: 'La tarea fue registrada correctamente.',
            confirmButtonColor: '#4f46e5'
          });
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al enviar tarea:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.error || 'No se pudo enviar la tarea.',
            confirmButtonColor: '#4f46e5'
          });
        }
      });
    });
  }

  cerrarCartillas(): void {
    Swal.fire({
      title: '¿Cerrar cartillas del trimestre?',
      text: `Se cerrarán todas las cartillas abiertas del trimestre ${this.numeroTrimestre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Cerrando cartillas...',
        text: 'Por favor espera unos segundos.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.materiasService.cerrarTrimestresPorMateria(this.materiaId, this.numeroTrimestre)
        .subscribe({
          next: (res) => {
            Swal.close(); // Cerrar el loader antes de mostrar resultado

            if (res.cerrados > 0) {
              Swal.fire({
                icon: 'success',
                title: 'Cartillas cerradas',
                text: `Se cerraron ${res.cerrados} cartillas.`,
                confirmButtonColor: '#4f46e5'
              }).then(() => {
                this.cargarEstudiantes();
              });
            } else {
              const listaPendientes = res.detalles_pendientes
                .map((p: any) => `<li><b>${p.apellidos} ${p.nombres}</b> — tiene parámetros sin calificar.</li>`)
                .join('');

              Swal.fire({
                icon: 'info',
                title: 'No se cerraron cartillas',
                html: `
                <p>Hay <b>${res.pendientes}</b> cartillas con parámetros pendientes:</p>
                <ul style="text-align:left; margin-top:10px;">${listaPendientes}</ul>
              `,
                confirmButtonColor: '#4f46e5'
              }).then(() => {
                this.cargarEstudiantes();
              });
            }
          },
          error: (err) => {
            console.error('Error al cerrar cartillas:', err);
            Swal.fire('Error', 'No se pudo cerrar las cartillas.', 'error');
          }
        });
    });
  }


  calificarActividad(actividadId: string, nota: number): void {
    if (nota === null || nota === undefined || isNaN(nota)) {
      Swal.fire({
        icon: 'warning',
        title: 'Nota inválida',
        text: 'Por favor ingresa una nota válida.',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    Swal.fire({
      title: 'Guardando calificación...',
      text: 'Por favor espera unos segundos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.materiasService.calificarActividad(actividadId, nota).subscribe({
      next: (res) => {
        Swal.close(); // Cerrar el loader inmediatamente

        Swal.fire({
          icon: 'success',
          title: 'Calificación registrada',
          text: 'La nota fue guardada correctamente.',
          confirmButtonColor: '#4f46e5',
          timer: 1500,
          showConfirmButton: false
        });

        // 🔹 Actualizar el estado local sin recargar todo
        // 1. Buscar en qué trimestre estamos (ya expandido)
        const trimestreId = this.trimestreExpandido;
        if (!trimestreId || !this.detallesTrimestre[trimestreId]) return;

        // 2. Buscar el parámetro y actividad que coincide
        const parametros = this.detallesTrimestre[trimestreId].parametros;

        for (const param of parametros) {
          const actividad = param.actividades.find((a: any) => a._id === actividadId);
          if (actividad) {
            // Actualizar los valores en el frontend localmente
            actividad.nota = nota;
            actividad.fecha_calificado = new Date().toISOString();
            // Sincroniza el valor local del input con la nota nueva
            this.notas[actividadId] = nota;
            // Bloquea nuevamente el campo
            this.edicionActiva[actividadId] = false;
            break;
          }

        }

        // Limpia el campo temporal
        this.notas[actividadId] = 0;
      },
      error: (err) => {
        console.error('Error al calificar actividad:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar la nota.',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  }

  irAtras(): void {
    if (this.materiaId) {
      this.router.navigate([`/materias/${this.materiaId}/trimestres`]);
    } else {
      // Por si acaso, si no hay materiaId, redirige al listado general
      this.router.navigate(['/materias']);
    }
  }

  async imprimirTrimestre(est: any): Promise<void> {
    try {
      if (!est.trimestre_id) {
        Swal.fire('Atención', 'Este estudiante no tiene trimestre creado.', 'info');
        return;
      }

      Swal.fire({
        title: 'Generando reporte...',
        text: 'Por favor espera unos segundos.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // 🔹 Consultar los datos del trimestre directamente
      const trimestre = await this.materiasService.getTrimestrePorId(est.trimestre_id).toPromise();

      if (!trimestre) {
        Swal.close();
        Swal.fire('Error', 'No se pudo obtener la información del trimestre.', 'error');
        return;
      }

      const pdf = new jsPDF();
      const margenIzq = 15;
      let y = 20;

      // 🔹 Encabezado principal
      pdf.setFontSize(20);
      pdf.setTextColor(33, 150, 243);
      pdf.text('SistemaPDGA', margenIzq, y);
      y += 10;

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Reporte Individual de Trimestre', margenIzq, y);
      y += 10;

      // 🔹 Información general
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Materia: ${this.data.materia}`, margenIzq, y); y += 6;
      pdf.text(`Curso: ${this.data.curso}`, margenIzq, y); y += 6;
      pdf.text(`Trimestre: ${this.data.trimestre_numero}`, margenIzq, y); y += 6;
      pdf.text(`Estudiante: ${est.apellidos} ${est.nombres}`, margenIzq, y); y += 6;
      pdf.text(`Promedio del trimestre: ${est.promedio_trimestre ?? '—'}`, margenIzq, y);
      y += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margenIzq, y, 195, y);
      y += 10;

      // 🔹 Parámetros y actividades
      for (const [index, p] of trimestre.parametros.entries()) {
        pdf.setFontSize(13);
        pdf.setTextColor(52, 73, 94);
        pdf.text(`${index + 1}. ${p.nombre}`, margenIzq, y);
        y += 6;

        pdf.setFontSize(10);
        pdf.setTextColor(90, 90, 90);
        pdf.text(`Porcentaje: ${p.porcentaje}% — Promedio: ${p.promedio_parametro ?? 'No calificado'}`, margenIzq, y);
        y += 6;

        if (p.actividades && p.actividades.length > 0) {
          const actividadesTabla = p.actividades.map((a: any, i: number) => [
            i + 1,
            a.nombre || 'Sin título',
            a.descripcion || 'Sin descripción',
            a.nota !== null ? a.nota.toFixed(2) : '—',
            new Date(a.fecha_registro).toLocaleDateString(),
            a.fecha_calificado ? new Date(a.fecha_calificado).toLocaleDateString() : '—'
          ]);

          autoTable(pdf, {
            startY: y + 2,
            head: [['#', 'Actividad', 'Descripción', 'Nota', 'Enviado', 'Calificado']],
            body: actividadesTabla,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [63, 81, 181], halign: 'center' },
            bodyStyles: { halign: 'center' },
            columnStyles: {
              1: { halign: 'left', cellWidth: 45 },
              2: { halign: 'left', cellWidth: 45 },
            },
            margin: { left: margenIzq },
          });

          y = (pdf as any).lastAutoTable.finalY + 10;
        } else {
          pdf.setFontSize(10);
          pdf.text('Sin actividades registradas.', margenIzq + 5, y);
          y += 10;
        }

        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
      }

      // 🔹 Pie del documento
      const fecha = new Date().toLocaleDateString();
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Emitido por SistemaPDGA — ${fecha}`, margenIzq, 285);

      const nombreArchivo = `Trimestre_${this.data.materia}_${est.apellidos}_${est.nombres}.pdf`;
      pdf.save(nombreArchivo);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'PDF generado correctamente',
        text: `Archivo: ${nombreArchivo}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.close();
      console.error('Error al generar PDF:', error);
      Swal.fire('Error', 'Ocurrió un problema al generar el PDF.', 'error');
    }
  }

}
