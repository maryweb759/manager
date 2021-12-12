import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { List } from 'src/app/models/list-model';
import { Task } from 'src/app/models/task-model';
import { TaskService } from 'src/app/service/task.service';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {
 lists: List[]; 
 tasks: Task[];

 selectedListId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
     this.route.params.subscribe((params: Params) => {
      // route.params make us able to get the id in the route 
      // we have to call params.listId cause that's what we have used in the parameters listId
      if(params.listId) {
        this.selectedListId = params.listId;
        this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
          console.log(tasks);
          this.tasks = tasks; 
       })
      } else {
        this.tasks = undefined
      }
       console.log(params)
     
    }) 

    this.taskService.getList().subscribe((lists: List[]) => {
      this.lists = lists
     // console.log(lists);
      
  })
  
  } 

  onTaskClick(task: Task) {
    // we want to set the task to complated
    this.taskService.complete(task).subscribe(() => {
     // console.log('completed');
      task.completed = !task.completed
    })
  }

  onDeleteListClick() {
     this.taskService.deleteList(this.selectedListId).subscribe((res) => {
      this.router.navigate(['/lists'])
     })
  }

  onTaskDeleteClick(id: string) {
    this.taskService.deleteTask(this.selectedListId, id).subscribe((res: any) => {
      // filter the tasks to get the tasks remaining in this list 
      this.tasks = this.tasks.filter(val => val._id !== id)
       console.log(res);
       
    })
  }

}
