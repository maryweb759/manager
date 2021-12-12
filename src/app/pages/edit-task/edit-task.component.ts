import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/service/task.service';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent implements OnInit {

 TaskId: string;
 listId: string;

  constructor(private taskService:TaskService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.listId = params.listId;
      this.TaskId = params.taskId
    })
  }

  updateTask(title: string) {
   this.taskService.updateTask(this.listId, this.TaskId, title).subscribe((res:any) => {
    console.log(res)

     this.router.navigate(['/lists', this.listId]);
   })
  }

}
