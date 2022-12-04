import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

const MobilePage: React.FC<{}> = ({}) => {
    const { t } = useTranslation();

    return (
        <MobilePageContainer>
            <Tips>{t('assistant.mobile.not_yet_develop')}</Tips>
        </MobilePageContainer>
    );
};

const MobilePageContainer = styled.div({
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: ' center',
});

const Tips = styled.div({});

export default MobilePage;
