import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './services/auth/auth.guard'
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AddcursosComponent } from './pages/addcursos/addcursos.component';
import { AddmateriasComponent } from './pages/addmaterias/addmaterias.component';
import { AddestudiantesComponent } from './pages/addestudiantes/addestudiantes.component';
import { AsistenciaComponent } from './pages/asistencia/asistencia.component';
import { RegistrarAsistenciaComponent } from './pages/registrar-asistencia/registrar-asistencia.component';
import { CursosasignadosComponent } from './pages/shared/cursosasignados/cursosasignados.component';
import { LosspassComponent } from './auth/losspass/losspass.component';
import { ChangepassComponent } from './auth/changepass/changepass.component';
import { MateriasasigandasComponent } from './pages/materiasasigandas/materiasasigandas.component';
import { MateriaTrimestresComponent } from './pages/materia-trimestres/materia-trimestres.component';
import { AlumnospormateriaComponent } from './pages/alumnospormateria/alumnospormateria.component';
import { DetallesalumnoComponent } from './pages/detallesalumno/detallesalumno.component';
import { VerasistenciaalumnoComponent } from './pages/verasistenciaalumno/verasistenciaalumno.component';
import { CalificacionesComponent } from './pages/calificaciones/calificaciones.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'losspassword', component: LosspassComponent },
    { path: 'changepassword/:id', component: ChangepassComponent },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
    { path: 'addcursos', component: AddcursosComponent, canActivate: [authGuard] },
    { path: 'cursos/:id/materias', component: AddmateriasComponent, canActivate: [authGuard] },
    { path: 'cursos/:id/estudiantes', component: AddestudiantesComponent, canActivate: [authGuard] },
    {
        path: 'asistencia',
        component: AsistenciaComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: CursosasignadosComponent },
            { path: 'registrar/:id', component: RegistrarAsistenciaComponent },
        ],
    },
    { path: 'materias/:id', component: MateriasasigandasComponent, canActivate: [authGuard] },
    { path: 'materias/:id/trimestres', component: MateriaTrimestresComponent, canActivate: [authGuard] },
    { path: 'materias/:id/trimestre/:numero/estudiantes', component: AlumnospormateriaComponent },
    { path: 'materias/:id/trimestre/:numero/detalle', component: DetallesalumnoComponent },
    { path: 'asistencia/estudiante', component: VerasistenciaalumnoComponent, canActivate: [authGuard] },
    { path: 'calificaciones', component: CalificacionesComponent, canActivate: [authGuard] },
];
