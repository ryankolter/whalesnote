import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

const AboutPage: React.FC<{}> = ({}) => {
    const { t } = useTranslation();

    return (
        <AboutPageContainer>
            <ChildPart>
                <PartTitle>{t('setting.about.project.title')}</PartTitle>
                <PartContent>
                    <Option>
                        <OptionTitle>{t('setting.about.project.version')}: </OptionTitle>
                        <OptionWord>1.1.0</OptionWord>
                    </Option>
                    <Option>
                        <OptionTitle>{t('setting.about.project.url')}: </OptionTitle>
                        <HrefLink target="_blank" href="https://github.com/ryankolter/whalesnote">
                            https://github.com/ryankolter/whalesnote
                        </HrefLink>
                    </Option>
                    <Option>
                        <OptionTitle>{t('setting.about.project.developer')}: </OptionTitle>
                        <OptionWord>Ryan Kolter</OptionWord>
                    </Option>
                </PartContent>
            </ChildPart>
        </AboutPageContainer>
    );
};

const AboutPageContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: '5px',
    userSelect: 'text',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
});

const PartContent = styled.div({
    padding: '0 0 0 30px',
});

const Option = styled.div({
    display: 'flex',
    height: '36px',
    fontSize: '14px',
});

const OptionTitle = styled.div({
    width: '100px',
});

const OptionWord = styled.div({
    flex: '1',
    minWidth: '0',
});

const HrefLink = styled.a({
    color: 'var(--render-link-text-color)',
});

export default AboutPage;
