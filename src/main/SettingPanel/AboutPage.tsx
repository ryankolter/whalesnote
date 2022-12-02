import { useCallback, useContext, useMemo } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

const AboutPage: React.FC<{}> = ({}) => {
    return (
        <AboutPageContainer>
            <ChildPart>
                <PartTitle>项目</PartTitle>
                <PartContent>
                    <Option>
                        <OptionTitle>版本: </OptionTitle>
                        <OptionWord>1.0.0</OptionWord>
                    </Option>
                    <Option>
                        <OptionTitle>开源地址: </OptionTitle>
                        <HrefLink target="_blank" href="https://github.com/ryankolter/whalenote">
                            https://github.com/ryankolter/whalenote
                        </HrefLink>
                    </Option>
                    <Option>
                        <OptionTitle>开发者: </OptionTitle>
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
