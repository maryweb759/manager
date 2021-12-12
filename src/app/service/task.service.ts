import { Injectable } from '@angular/core';
import { HttpRequestService } from './http-request.service';
import { Task } from '../models/task-model';
@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private httpservice: HttpRequestService) { } 
  
  getList() {
    return this.httpservice.get('lists')
  } 

  createList(title: string) {
    // we want to send a web request to send a list 
     return this.httpservice.post('lists', {title} )
  } 

  updateList(id: string, title: string) {
     // We want to send a web request to update a list
    return this.httpservice.patch(`lists/${id}`, {title} )
  }

  deleteList(id: string) {
    return this.httpservice.delete(`lists/${id}`) ;
  }


  getTasks(listId: string) {
    return this.httpservice.get(`lists/${listId}/tasks`)
  } 

  /////// create task 
  createTask(title: string, listId:string) {
   return this.httpservice.post(`lists/${listId}/tasks`, { title } )
  } 

  updateTask(listId: string, taskId: string, title: string) {
    // We want to send a web request to update a list
   return this.httpservice.patch(`lists/${listId}/tasks/${taskId}`, {title} )
 }

 deleteTask(listId: string, taskId: string) {
   return this.httpservice.delete(`lists/${listId}/tasks/${taskId}`) ;
 }

  complete(task: Task) {
    return this.httpservice.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    })
  }


}
