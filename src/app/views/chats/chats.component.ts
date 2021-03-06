import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';
import { StorageService, Events } from 'src/app/services/services';
import { ChatSummary } from 'src/app/models/ChatSummary';
import { Contact } from 'src/app/models/Contact';
import { Chat } from 'src/app/models/Chat';
import { Organization } from 'src/app/models/Organization';
import { Message } from 'src/app/models/Message';
import { MessageService } from 'src/app/services/message.service';

@Component({
  selector: 'app-chats-view',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.scss'],
  exportAs: 'ChatsViewComponent'
})
export class ChatsViewComponent implements OnInit {

  public currentUser: any;

  public chats: ChatSummary[] = new Array<ChatSummary>();

  public selectedChatId: number;

  strip(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  constructor(private events: Events,
    private chatService: ChatService,
    private messageService: MessageService,
    private storageService: StorageService) {
    this.currentUser = storageService.get('user');
  }

  public getFilteredChatsByContactId(contactId: number): void {
    const that = this;
    this.chatService.getFilteredChatsByContactId(contactId).subscribe((response: any) => {
      if (response.status === 'success') {
        for (const record of response.records) {
          if (record != null) {
            const chat = new ChatSummary.Builder()
              .withServerId(record.messageServerId)
              .withDeviceId(record.messageDeviceId)
              .withContent(that.strip(record.messageContent))
              .withStatus(record.messageStatus)
              .withContact(new Contact.Builder(record.messageContactId)
                .withDescription(record.messageContactDescription)
                .withShortDescription(record.messageContactShortDescription)
                .withType(record.messageContactType)
                .build()
              )
              .withChat(new Chat.Builder(record.messageChatId)
                .withSubject(record.messageChatSubject || '(Sem Assunto)')
                .withContactFrom(new Contact.Builder(record.chatContactFromId)
                  .withDescription(record.chatContactFromDescription)
                  .withShortDescription(record.chatContactFromShortDescription)
                  .withType(record.chatContactFromType).build()
                )
                .withContactTo(new Contact.Builder(record.chatContactToId)
                  .withDescription(record.chatContactToDescription)
                  .withShortDescription(record.chatContactToShortDescription)
                  .withType(record.chatContactToType).build()
                )
                .withOrganizationFrom(new Organization.Builder(null)
                  .withName(record.organizationFromName)
                )
                .withOrganizationTo(new Organization.Builder(null)
                  .withName(record.organizationToName)
                )
                .build()
              )
              .withOrganizationFrom(record.organizationFromName || '')
              .withOrganizationTo(record.organizationToName || '')
              .withCreatedAt(record.messageCreatedAt)
              .withUpdatedAt(record.messageUpdatedAt)
              .build();

            chat.nonReadMessages = record.nonReadMessages;

            that.chats.push(chat);
          }
        }
      }
    });
  }

  public select(chatId: number, chat: Chat): void {
    this.selectedChatId = chatId;

    this.events.next(`chats::selected`, chat);
  }

  public isSelected(chatId: number): boolean {
    return this.selectedChatId === chatId;
  }

  public ngOnInit() {
    this.getFilteredChatsByContactId(this.currentUser.contact.id);

    this.events.subscribe(`message::created`, (message: Message) => {
      this.messageService.emit(`message::received`, {
        serverId: message.serverId, contact: this.currentUser.contact
      });
    });
    this.events.subscribe(`message::updated`, (message: Message) => {
      this.messageService.emit(`message::received`, {
        serverId: message.serverId, contact: this.currentUser.contact
      });
    });
  }

}
