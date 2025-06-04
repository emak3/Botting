import { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    InteractionContextType, 
    MessageFlags, 
} from 'discord.js';

const commandObject = {
    command: new SlashCommandBuilder()
        .setName("test")
        .setDescription("おためし")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {

        await interaction.reply({
            content: ``,
            flags: MessageFlags.Ephemeral
        });
    }
};

export default commandObject;