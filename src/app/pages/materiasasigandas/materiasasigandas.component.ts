import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CursosService } from '../../services/server/cursos.service';
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

}