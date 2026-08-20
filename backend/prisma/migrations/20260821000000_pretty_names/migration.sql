-- Renomeia a turma legada da migração v7 com nomes mais bonitos.
-- As FKs têm ON UPDATE CASCADE, então o id novo propaga para GroupMember e Game.

-- Novo id amigável
UPDATE "Group" SET "id" = 'turma-fundadora' WHERE "id" = 'group-heranca';

-- (Segurança explícita, mesmo com o CASCADE das FKs)
UPDATE "GroupMember" SET "groupId" = 'turma-fundadora' WHERE "groupId" = 'group-heranca';
UPDATE "Game" SET "groupId" = 'turma-fundadora' WHERE "groupId" = 'group-heranca';

-- Nome, convite e descrição mais sofisticados
UPDATE "Group"
SET "name" = 'Turma Fundadora',
    "inviteCode" = 'TURMA-FUNDADORA-001',
    "description" = 'A primeira turma do NogaGames, fundada quando os grupos chegaram.'
WHERE "id" = 'turma-fundadora';