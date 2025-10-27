import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MateriasService } from '../../services/server/materias.service';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-materia-trimestres',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
  templateUrl: './materia-trimestres.component.html',
  styleUrl: './materia-trimestres.component.css'
})
export class MateriaTrimestresComponent implements OnInit {
  materiaId!: string;
  cursoId!: string;
  data: any = null;
  cargando = true;
  error = '';
  esDocente = false;

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.materiaId = this.route.snapshot.paramMap.get('id')!;
    this.mostrarCargando();
    this.verificarRolUsuario();
    this.cargarTrimestres();
  }

  mostrarCargando(): void {
    Swal.fire({
      title: 'Cargando trimestres...',
      text: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  verificarRolUsuario(): void {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        const userObj = JSON.parse(usuario);
        this.esDocente = userObj.rol?.toLowerCase() === 'docente';
      } catch {
        this.esDocente = false;
      }
    }
  }

  cargarTrimestres(): void {
    this.materiasService.getTrimestresPorMateria(this.materiaId).subscribe({
      next: (res) => {
        this.data = res;
        if (res?.curso_id) {
          this.cursoId = res.curso_id;
        } else if (res?.materia?.curso_id) {
          this.cursoId = res.materia.curso_id;
        }
        this.cargando = false;
        Swal.close();
      },
      error: (err) => {
        console.error('Error al obtener trimestres:', err);
        this.error = 'No se pudieron cargar los trimestres.';
        this.cargando = false;
      }
    });
  }

  crearTrimestres(): void {
    Swal.fire({
      title: '¿Crear cartillas?',
      text: 'Se generarán las cartillas de calificaciones vacias para todos los estudiantes de esta materia.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.cargando = true;

      // Mostrar loading mientras se ejecuta la petición
      Swal.fire({
        title: 'Creando trimestres...',
        text: 'Por favor espera unos segundos.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.materiasService.crearTrimestresPorMateria(this.materiaId).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Trimestres creados!',
            text: res.mensaje,
            confirmButtonColor: '#4f46e5'
          });
          this.cargarTrimestres(); // recarga la vista
        },
        error: (err) => {
          console.error('Error al crear trimestres:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.error || 'No se pudieron crear los trimestres.',
            confirmButtonColor: '#4f46e5'
          });
          this.cargando = false;
        },
      });
    });
  }

  irAtras(): void {
    if (this.cursoId) {
      this.router.navigate([`/materias/${this.cursoId}`]);
    } else {
      this.router.navigate(['/home']);
    }
  }

}