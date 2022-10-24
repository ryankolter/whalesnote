import styled from '@emotion/styled';
import { useCallback } from 'react';

import SvgIcon from '../../components/SvgIcon';
import dataPanelIcon from '../../resources/icon/sideBar/dataPanelIcon.svg';
import mobilePanelIcon from '../../resources/icon/sideBar/mobilePanelIcon.svg';
import modelPanelIcon from '../../resources/icon/sideBar/modelPanelIcon.svg';
import trashPanelIcon from '../../resources/icon/sideBar/trashPanelIcon.svg';
import settingPanelIcon from '../../resources/icon/sideBar/settingPanelIcon.svg';

const BottomIcons: React.FC<{
    curAssistantPanelName: string;
    setCurAssistantPanelName: React.Dispatch<React.SetStateAction<string>>;
}> = ({ curAssistantPanelName, setCurAssistantPanelName }) => {
    const handleSvgIconClick = useCallback((btn_type: string) => {
        setCurAssistantPanelName((curAssistantPanelName: string) => {
            if (curAssistantPanelName === btn_type) {
                return 'none';
            } else {
                return btn_type;
            }
        });
    }, []);

    return (
        <BottomIconsContainer>
            <SvgIcon
                iconWidth={29}
                iconHeight={32}
                iconPadding={12}
                iconSrc={dataPanelIcon}
                onClick={() => handleSvgIconClick('data_space')}
            />
            <SvgIcon
                iconWidth={27}
                iconHeight={33}
                iconPadding={12}
                iconSrc={mobilePanelIcon}
                onClick={() => handleSvgIconClick('mobile_panel')}
            />
            <SvgIcon
                iconWidth={30}
                iconHeight={26}
                iconPadding={12}
                iconSrc={modelPanelIcon}
                onClick={() => handleSvgIconClick('image_space')}
            />
            <SvgIcon
                iconWidth={26}
                iconHeight={33}
                iconPadding={12}
                iconSrc={trashPanelIcon}
                onClick={() => handleSvgIconClick('trash_list')}
            />
            <SvgIcon
                iconWidth={32}
                iconHeight={32}
                iconPadding={12}
                iconSrc={settingPanelIcon}
                onClick={() => handleSvgIconClick('setting_panel')}
            />
        </BottomIconsContainer>
    );
};

const BottomIconsContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '15px',
    cursor: 'pointer',
});

export default BottomIcons;
