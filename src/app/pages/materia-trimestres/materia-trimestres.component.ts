import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MateriasService } from '../../services/server/materias.service';
import { NavbarComponent } from "../shared/navbar/navbar.component";

@Component({
  selector: 'app-materia-trimestres',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './materia-trimestres.component.html',
  styleUrl: './materia-trimestres.component.css'
})
export class MateriaTrimestresComponent implements OnInit {
  materiaId!: string;
  data: any = null;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService
  ) {}

  ngOnInit(): void {
    this.materiaId = this.route.snapshot.paramMap.get('id')!;
    this.cargarTrimestres();
  }

  cargarTrimestres(): void {
    this.materiasService.getTrimestresPorMateria(this.materiaId).subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener trimestres:', err);
        this.error = 'No se pudieron cargar los trimestres.';
        this.cargando = false;
      }
    });
  }
}