import { registerContextTool } from "@superexpert-ai/framework";
import { prisma } from "@/lib/db/prisma";

registerContextTool({
    name: 'whichAgent',
    category: 'sample',
    description: 'This tool returns the current agent id and name',
    async function() {
        await this.log.info('whichAgent tool called');
        return `My agent id is ${this.agent.id} and my agent name is ${this.agent.name} and I am awesome`;
    },
});

registerContextTool({
    name: 'loadMemories',
    category: 'experimental',
    description: 'Loads memories',
    async function() {
        const memories = await prisma.memories.findMany({
            where: {
                userId: this.user.id,
                agentId: this.agent.id,
            },
            orderBy: {
                createdAt: 'desc',  
            }
        });
        return memories.map(memory => `${memory.createdAt} - ${memory.content}`).join('\n');

    },
});

registerContextTool({
    name: 'robotOrderStatus',
    category: 'sample',
    description: 'This tool retrieves all orders for the current customer.',
    function() {
        const userId = this.user.id;
        // Retrieve all orders for the current customer from the database.
        const orders = [
            {
                orderId: 1,
                product: 'Laser Robot',
                status: 'Shipped',
                trackingNumber: '1234567890',
                expectedDeliveryDate: new Date(new Date(this.user.now).getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            {
                orderId: 2,
                product: 'Robot Dog',
                status: 'Out of Stock',
                trackingNumber: '1234567899',
                expectedDeliveryDate: null,
            },
        ];

        // Always return a string from a tool (can be JSON, XML, etc.)
        // In this case, we are returning a string representation of the orders.
        return `Here are the customer's orders:\n` + orders.map(order => {    
            return `Order ID: ${order.orderId}, Product: ${order.product}, Status: ${order.status}, Tracking Number: ${order.trackingNumber}, Expected Delivery Date: ${order.expectedDeliveryDate ? order.expectedDeliveryDate.toLocaleDateString() : 'N/A'}`;
        }
        ).join('\n');
    },
});



