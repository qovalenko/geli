import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {MessageService} from '../../services/message.service';
import {ChatService} from '../../services/chat.service';
import {IMessage} from '../../../../../../../shared/models/IMessage';
import {SocketIOEvent} from '../../../../../../../shared/models/SoketIOEvent';
import {Message} from '../../../models/Message';
import {MatDialog} from '@angular/material';
import {ChatNameInputDialogComponent} from '../chat-name-input-dialog/chat-name-input-dialog.component';
import {Subscription} from 'rxjs/Subscription';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() room: string;
  @Input() anonymous: boolean;
  chatName: string;
  chatNameSubscription: Subscription;
  messages: IMessage[] = [];
  ioConnection: any;
  inputValue: string = null;

  constructor(private messageService: MessageService, private chatService: ChatService, private userService: UserService, public dialog: MatDialog) {
    //TODO: remove the next line later
    this.anonymous = true;
    if(this.anonymous){
      this.chatNameSubscription = this.chatService.chatName$.subscribe(chatName => {
        console.log('getting new value')
          this.chatName = chatName;
      })
    }
  }

  async ngOnInit() {
    const queryParam = {room: this.room};
    this.messages = await this.messageService.getMessages(queryParam);
    this.initSocketConnection();
  }

  ngOnDestroy() {
    this.chatNameSubscription.unsubscribe();
  }



  initSocketConnection (): void {
    this.chatService.initSocket(this.room);

    this.ioConnection = this.chatService.onMessage()
      .subscribe((message: IMessage) => {
        this.messages.push(message);
      });


    this.chatService.onEvent(SocketIOEvent.CONNECT)
      .subscribe(() => {
        console.log('connected');
      });



    this.chatService.onEvent(SocketIOEvent.DISCONNECT)
      .subscribe(() => {
        console.log('disconnected');
      });
  }


  onEnter() {
    if(!this.chatName){
      const temporaryNameDialog = this.dialog.open(ChatNameInputDialogComponent);
      temporaryNameDialog.afterClosed()
        .subscribe((chatName : string)=> {
          this.chatService.setChatName(chatName);
          this.postMessage();
        });
    }else {
      this.postMessage();
    }
  }

  postMessage() {
    const message = {
      chatName: this.chatName,
      content: this.inputValue,
      room: this.room,
      author: this.chatName ? {_id: this.userService.user._id}:  this.userService.user  // TODO: send only required information
    };
    this.chatService.send(message);
    this.inputValue = null;
  }

}