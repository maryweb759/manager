import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/service/task.service';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {
  listId: string;
  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void { 
    this.route.params.subscribe((params: Params) => {
      // route.params make us able to get the id in the route 
      // we have to call params.listId cause that's what we have used in the parameters listId
      this.listId = params['listId'];
       console.log(params)
     
    }) 

  }
  
  createTask(title: string) {
    this.taskService.createTask(title, this.listId).subscribe((task: any) => {
      console.log(task); 
      // the ../ make us go back one folder and relativeTo: this.route is the way
      // how we get the params to go back to list were we have added the task
      this.router.navigate(['../'], { relativeTo: this.route })
    })
  }
}
