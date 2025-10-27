import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
import { MateriasService } from '../../services/server/materias.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-materiasasigandas',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './materiasasigandas.component.html',
  styleUrl: './materiasasigandas.component.css'
})
export class MateriasasigandasComponent implements OnInit {

  materias: any[] = [];
  cursoId!: string;
  cargando: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private materiasService: MateriasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cursoId = this.route.snapshot.paramMap.get('id')!;
    this.mostrarCargando();
    this.cargarMaterias();
  }

  mostrarCargando(): void {
    Swal.fire({
      title: 'Cargando materias...',
      text: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  cargarMaterias() {
    this.cursosService.getMateriasPorCurso(this.cursoId).subscribe({
      next: (data) => {
        this.materias = data;
        this.cargando = false;
        Swal.close();
      },
      error: (err) => {
        this.error = 'Error al cargar las materias';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  abrirMateria(id: string): void {
    this.router.navigate(['/materias', id, 'trimestres']);
  }

  irAtras(): void {
    this.router.navigate(['/home']);
  }


  cerrarCurso(): void {
    Swal.fire({
      title: '¿Cerrar curso?',
      html: `
        <div class="text-gray-700 leading-relaxed">
          <p>Solo se cerrarán los <b>estudiantes</b> que tengan sus <b>tres trimestres calificados</b>.</p>
          <p class="mt-2 text-sm text-gray-500">
            Si algún estudiante tiene un trimestre incompleto, su promedio final no será generado.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar curso',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#6B7280'
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Cerrando curso...',
        text: 'Por favor espera unos segundos mientras se procesan los promedios.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.materiasService.finalizarPromedios(this.cursoId).subscribe({
        next: (res: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Curso cerrado correctamente',
            html: `
              <p class="text-gray-700">
                Los promedios finales fueron generados para los estudiantes con los tres trimestres calificados.
              </p>
              <p class="mt-2 text-sm text-gray-500">Puedes revisar los resultados en la sección de reportes o promedios finales.</p>
            `,
            confirmButtonColor: '#4F46E5'
          }).then(() => this.irAtras());
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al cerrar el curso',
            text: err?.error?.mensaje || 'No se pudo finalizar el proceso de cierre del curso.',
            confirmButtonColor: '#DC2626'
          });
        }
      });
    });
  }

}