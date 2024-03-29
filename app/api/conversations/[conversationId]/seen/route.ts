import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prismadb"
import { pusherServer } from "@/app/lib/pusher";

interface IParams {
    conversationId?: string;
};

export async function POST(
    request: Request,
    { params }: { params: IParams }
) {
    try {
        const currentUser = await getCurrentUser();
        const { conversationId } = params;

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        //find the existing conversation
        const conversation = await prisma?.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                messages: {
                    include: {
                        seen: true
                    }
                },
                users: true,
            }
        });

        if (!conversation) {
            return new NextResponse('Invalid ID', { status: 400 });
        }

        //find the last chat
        const lastMessage = conversation.messages[conversation.messages.length - 1];

        if (!lastMessage) {
            return NextResponse.json(conversation);
        }

        //update seen of last message
        const updateMessage = await prisma.message.update({
            where: {
                id: lastMessage.id
            },
            include: {
                sender: true,
                seen: true
            },
            data: {
                seen: {
                    connect: {
                        id: currentUser.id
                    }
                }
            }
        });

        await pusherServer.trigger(currentUser.email, 'conversation:update', {
            id: conversationId,
            messages: [updateMessage]
        });

        if (lastMessage.seenIds.indexOf(currentUser.id) !== -1) {
            return NextResponse.json(conversation)
        }

        await pusherServer.trigger(conversationId!, 'message:update', updateMessage)

        // Update all connections with new seen
    await pusherServer.trigger(currentUser.email, 'conversation:update', {
        id: conversationId,
        messages: [updateMessage]
      });
  
      // If user has already seen the message, no need to go further
      if (lastMessage.seenIds.indexOf(currentUser.id) !== -1) {
        return NextResponse.json(conversation);
      }
  
      // Update last message seen
      await pusherServer.trigger(conversationId!, 'message:update', updateMessage);

        return NextResponse.json(updateMessage);
    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES_SEEN");
        return new NextResponse("Internal Error", { status: 500 });
    } 
}