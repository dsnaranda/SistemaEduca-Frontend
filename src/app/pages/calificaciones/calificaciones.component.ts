import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { CursosService } from '../../services/server/cursos.service';
import { MateriasService } from '../../services/server/materias.service';
import { LoadingHelper } from '../shared/loading.helper';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Cargar cursos del docente o estudiante
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

  // Ver la cartilla final del curso
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

  // Alternar vista de detalles
  toggleExpand(id: string): void {
    this.expandido = this.expandido === id ? null : id;
  }

  // Volver a la lista de cursos
  irAtras(): void {
    this.cursoSeleccionado = null;
    this.cartilla = [];
    this.expandido = null;
  }

  // Reordenar la tabla al hacer clic en el encabezado
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

  async imprimirCartilla(est: any): Promise<void> {
    try {
      Swal.fire({
        title: 'Generando cartilla...',
        text: 'Por favor espera mientras se compila toda la información.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const pdf = new jsPDF();
      const margenIzq = 15;
      let y = 20;

      // 🔹 Encabezado general
      pdf.setFontSize(20);
      pdf.setTextColor(33, 150, 243); // Azul institucional
      pdf.text('SistemaPDGA', margenIzq, y);
      y += 10;

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Cartilla Final del Curso', margenIzq, y);
      y += 10;

      // 🔹 Datos del curso y estudiante
      pdf.setFontSize(11);
      pdf.text(`Curso: ${this.cursoSeleccionado?.nombre} - ${this.cursoSeleccionado?.nivel}°${this.cursoSeleccionado?.paralelo}`, margenIzq, y);
      y += 6;
      pdf.text(`Estudiante: ${est.apellidos} ${est.nombres}`, margenIzq, y);
      y += 6;
      pdf.text(`Promedio Final del Curso: ${est.promedio_curso}`, margenIzq, y);
      y += 6;
      pdf.text(`Estado: ${est.estado}`, margenIzq, y);
      y += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margenIzq, y, 195, y);
      y += 10;

      // 🔹 Recorrer materias
      for (const [index, materia] of est.detalle_materias.entries()) {
        pdf.setFontSize(13);
        pdf.setTextColor(52, 73, 94);
        pdf.text(`${index + 1}. ${materia.materia_nombre}`, margenIzq, y);
        y += 6;

        pdf.setFontSize(11);
        pdf.setTextColor(90, 90, 90);
        pdf.text(`Promedio final: ${materia.promedio_materia}`, margenIzq, y);
        y += 5;

        // Tabla resumen de los tres trimestres
        const resumenTrimestres = materia.trimestres.map((t: any) => [
          `Trimestre ${t.numero}`,
          t.promedio_trimestre?.toFixed(2)
        ]);

        autoTable(pdf, {
          startY: y + 2,
          head: [['Trimestre', 'Promedio']],
          body: resumenTrimestres,
          theme: 'striped',
          styles: { halign: 'center', fontSize: 10 },
          headStyles: { fillColor: [63, 81, 181] },
          margin: { left: margenIzq },
        });

        y = (pdf as any).lastAutoTable.finalY + 5;

        // 🔹 Consultar información de cada trimestre por ID
        for (const t of materia.trimestres) {
          const trimestreData = await this.materiasService.getTrimestrePorId(t.trimestre_id).toPromise();

          if (trimestreData && trimestreData.parametros && trimestreData.parametros.length > 0) {
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Detalles del Trimestre ${t.numero}:`, margenIzq, y);
            y += 5;

            const parametrosData = trimestreData.parametros.map((p: any) => [
              p.nombre,
              `${p.promedio_parametro?.toFixed(2) || '-'}`,
              `${p.porcentaje}%`
            ]);

            autoTable(pdf, {
              startY: y,
              head: [['Parámetro', 'Nota', 'Peso (%)']],
              body: parametrosData,
              theme: 'grid',
              styles: { fontSize: 9 },
              headStyles: { fillColor: [76, 175, 80] },
              margin: { left: margenIzq },
            });

            y = (pdf as any).lastAutoTable.finalY + 10;
          }
        }

        // Salto de página si se acerca al final
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
      }

      // 🔹 Pie de página
      const fecha = new Date().toLocaleDateString();
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Emitido por SistemaPDGA - ${fecha}`, margenIzq, 285);

      const nombreArchivo = `Cartilla_${est.apellidos}_${est.nombres}.pdf`;
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
      console.error('Error al generar cartilla:', error);
      Swal.fire('Error', 'Ocurrió un problema al generar la cartilla.', 'error');
    }
  }

}
