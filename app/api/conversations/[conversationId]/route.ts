import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prismadb"
import { pusherServer } from "@/app/lib/pusher";

interface IParams {
    conversationId?: string;
}

export async function DELETE(
    request: Request,
    { params }: { params: IParams}
) {
    try {
        const { conversationId } = params;
        const cureentUser = await getCurrentUser();

        if (!cureentUser?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const existingConversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                users: true
            }
        });

        if (!existingConversation) {
            return new NextResponse('Invalid ID', { status: 400 })
        }

        const deleteConversation = await prisma.conversation.deleteMany({
            where: {
                id: conversationId,
                userIds: {
                    hasSome: [cureentUser.id]
                }
            }
        })

        existingConversation.users.forEach((user) => {
            if (user.email) {
                pusherServer.trigger(user.email, 'conversation:remove', existingConversation);
            }
        })

        return NextResponse.json(deleteConversation);
    } catch (error: any) {
        console.log(error, 'ERROR_CONVERSATION_DELETE');
        return new NextResponse('Internal Error', { status: 500 })
    }
}