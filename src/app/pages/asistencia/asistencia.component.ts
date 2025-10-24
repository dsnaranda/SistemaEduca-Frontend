import { Component } from '@angular/core';
import { CursosasignadosComponent } from "../shared/cursosasignados/cursosasignados.component";
import { NavbarComponent } from "../shared/navbar/navbar.component";
//import { RouterOutlet } from "../../../../node_modules/@angular/router/index";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [ NavbarComponent, RouterOutlet],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.css'
})
export class AsistenciaComponent {

}
