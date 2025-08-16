import QRCode from "qrcode.react";
import * as React from "react";

const Qcode = ({mfa_url}) => {

    return (
        <QRCode
            value={mfa_url}
            renderAs="svg"
            level="M"
            fgColor="#333"
            bgColor="#fff"
            key="level-M"
            height="200px"
            width="100%"
        />
    );
};

export default Qcode;

