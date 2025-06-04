import { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } from 'discord.js';
import NetkeibaScraper from '../../cheerio/netkeibaScraper.mjs';

// Discord コマンド定義
const commandObject = {
    command: new SlashCommandBuilder()
        .setName('race')
        .setDescription('競馬の出馬表を取得します')
        .addStringOption(option =>
            option.setName('raceid')
                .setDescription('レースID (例: 202505030211)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        await interaction.deferReply();

        const raceId = interaction.options.getString('raceid');
        const scraper = new NetkeibaScraper();

        try {
            const result = await scraper.scrapeRaceCard(raceId);

            // Discord Embedの作成
            const embed = {
                color: 0x0099FF,
                title: `🐎 ${result.raceInfo?.title || 'レース情報'}`,
                description: `**日程:** ${result.raceInfo?.date || 'N/A'}\n**コース:** ${result.raceInfo?.course || 'N/A'}`,
                fields: result.horses.slice(0, 18).map((horse, index) => ({
                    name: `${index + 1}. ${horse.name}`,
                    value: `枠${horse.frameNumber} | 馬番${horse.horseNumber} | ${horse.age} | ${horse.weight}kg\n騎手: ${horse.jockey} | オッズ: ${horse.odds}`,
                    inline: true
                })),
                footer: {
                    text: `Total: ${result.totalHorses}頭 | ${result.scrapedAt}`
                }
            };

            if (result.horses.length > 18) {
                embed.fields.push({
                    name: '注意',
                    value: `表示は上位10頭まで。全${result.totalHorses}頭のデータを取得済み。`,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('Race command error:', error);
            await interaction.editReply({
                content: `❌ エラーが発生しました: ${error.message}\n\n**考えられる原因:**\n- 無効なレースID\n- ネットワークエラー\n- サイトのアクセス制限`
            });
        }
    }
};
export default commandObject;