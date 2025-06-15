import React from "react";
import NoteListtwo from "../components/NoteListtwo";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

const SharingPage = () => {
    const { t } = useTranslation('sharing'); // 指定 sharing 命名空間

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{t('noteSharing')}</h1>
            <NoteListtwo />
        </div>
    );
};

export default SharingPage;