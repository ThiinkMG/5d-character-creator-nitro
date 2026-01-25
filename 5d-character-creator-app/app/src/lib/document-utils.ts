import { CharacterDocument } from '@/types/document';
import { ChatSession } from '@/types/chat';

/**
 * Generate a document title from chat session content
 */
export function generateDocumentTitle(session: ChatSession, type: 'script' | 'roleplay'): string {
    // Try to extract a meaningful title from the conversation
    const firstUserMessage = session.messages.find(m => m.role === 'user');
    const firstAssistantMessage = session.messages.find(m => m.role === 'assistant');
    
    if (session.title && !session.title.includes('(Branch)')) {
        return `${session.title} - ${type === 'script' ? 'Script' : 'Roleplay'}`;
    }
    
    // Try to extract from first user message
    if (firstUserMessage) {
        const content = firstUserMessage.content.slice(0, 50);
        if (content.length > 0) {
            return `${content}... - ${type === 'script' ? 'Script' : 'Roleplay'}`;
        }
    }
    
    // Fallback to date-based title
    const date = new Date(session.createdAt).toLocaleDateString();
    return `${type === 'script' ? 'Script' : 'Roleplay'} Session - ${date}`;
}

/**
 * Convert chat session to document content
 */
export function sessionToDocumentContent(session: ChatSession, type: 'script' | 'roleplay'): string {
    let content = `# ${session.title || 'Untitled Session'}\n\n`;
    content += `**Type:** ${type === 'script' ? 'Script' : 'Roleplay'}\n`;
    content += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n\n`;
    
    if (session.summary) {
        content += `## Summary\n\n${session.summary}\n\n`;
    }
    
    content += `## Conversation\n\n`;
    
    session.messages.forEach((message, idx) => {
        const role = message.role === 'user' ? 'User' : 'Assistant';
        content += `### ${role} (Message ${idx + 1})\n\n`;
        content += `${message.content}\n\n`;
        
        if (message.choices && message.choices.length > 0) {
            content += `**Options:**\n`;
            message.choices.forEach(choice => {
                content += `- ${choice.label}${choice.description ? `: ${choice.description}` : ''}\n`;
            });
            content += `\n`;
        }
    });
    
    return content;
}

/**
 * Create a document from a chat session
 */
export function createDocumentFromSession(
    session: ChatSession,
    characterId: string,
    type: 'script' | 'roleplay'
): CharacterDocument {
    const now = new Date();
    const title = generateDocumentTitle(session, type);
    const content = sessionToDocumentContent(session, type);
    
    return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        characterId,
        type,
        title,
        content,
        createdAt: now,
        updatedAt: now,
        metadata: {
            sessionId: session.id,
            sceneType: (session as any).metadata?.sceneType,
            tone: (session as any).metadata?.tone,
            length: (session as any).metadata?.length,
            characters: session.relatedId ? [session.relatedId] : [],
        }
    };
}
