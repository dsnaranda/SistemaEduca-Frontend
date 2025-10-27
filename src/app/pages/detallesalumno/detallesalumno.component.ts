import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from "../shared/navbar/navbar.component";

@Component({
  selector: 'app-detallesalumno',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './detallesalumno.component.html',
  styleUrl: './detallesalumno.component.css'
})
export class DetallesalumnoComponent implements OnInit {
  materiaId!: string;
  numeroTrimestre!: number;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.materiaId = this.route.snapshot.paramMap.get('id')!;
    this.numeroTrimestre = Number(this.route.snapshot.paramMap.get('numero'));

    console.log('Materia ID:', this.materiaId);
    console.log('Trimestre:', this.numeroTrimestre);
  }
}