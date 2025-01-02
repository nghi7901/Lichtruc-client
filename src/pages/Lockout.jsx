import LogoVLU from '../assets/img/logoVLU.png'
import bgLogin from '../assets/img/bg-login.jpg';

const Lockout = () => {

    const styles = {
        section: {
            padding: '2rem 0',
            backgroundSize: 'cover',
            position: 'relative',
            display: 'grid',
            alignItems: 'center',
            minHeight: '92vh',
            zIndex: 0,
            textAlign: 'center',
            backgroundImage: `url(${bgLogin})`,
        },
        image: {
            margin: '0 auto',
            width: '100px',
            padding: '30px 0',
        },
    };
    return (
        <div>
            <style>
                {`
                body,
                html {
                    margin: 0;
                    padding: 0;
                    font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
                    font-weight: 400;
                }

                * {
                    box-sizing: border-box;
                }

                .d-grid {
                    display: grid;
                }

                .d-flex {
                    display: flex;
                    display: -webkit-flex;
                }

                .text-center {
                    text-align: center;
                }

                .text-left {
                    text-align: left;
                }

                .text-right {
                    text-align: right;
                }

                button,
                input,
                select {
                    -webkit-appearance: none;
                    outline: none;
                }

                button,
                .btn,
                select {
                    cursor: pointer;
                }

                .title-login {
                    color: white;
                }

                .title-login-page {
                    color: #5d171c;
                    font-size: 30px;
                }

                .btn,
                button,
                .actionbg,
                input {
                    border-radius: 4px;
                }

                .btn:hover,
                button:hover {
                    transition: 0.5s ease;
                }

                /*--/wrapper--*/
                .wrapper {
                    width: 100%;
                    padding-right: 15px;
                    padding-left: 15px;
                    margin-right: auto;
                    margin-left: auto;
                }

                @media (min-width: 576px) {
                    .wrapper {
                        max-width: 540px;
                    }
                }

                @media (min-width: 768px) {
                    .wrapper {
                        max-width: 720px;
                    }
                }

                @media (min-width: 992px) {
                    .wrapper {
                        max-width: 960px;
                    }
                }

                @media (min-width: 1200px) {
                    .wrapper {
                        max-width: 1140px;
                    }
                }

                .wrapper-full {
                    width: 100%;
                    padding-right: 15px;
                    padding-left: 15px;
                    margin-right: auto;
                    margin-left: auto;
                }

                /*--//wrapper--*/
                /*-- login --*/
                .main-content h1 {
                    margin-bottom: 40px;
                    font-size: 40px;
                    color: #fff;
                    margin-top: -15px;
                }

                .section {
                    padding: 2rem 0;
                    background-size: cover;
                    position: relative;
                    display: grid;
                    align-items: center;
                    height: 91%;
                    z-index: 0;
                    text-align: center;
                }

                .section:before {
                    content: "";
                    background: rgba(107, 25, 45, 0.4);
                    position: absolute;
                    top: 0;
                    min-height: 100%;
                    left: 0;
                    right: 0;
                    z-index: -1;
                }

                .main-content .login-form {
                    background: rgba(0, 0, 0, .6);
                    box-shadow: 0 10px 30px 0 rgba(17, 17, 17, 0.09);
                    margin: 0 auto;
                    max-width: 430px;
                    text-align: center;
                    border-radius: 0 0 6px 6px;
                }

                .main-content .login-form h6 {
                    font-size: 24px;
                    line-height: 30px;
                    color: #fff;
                    padding-top: 5em;
                    padding-bottom: 2em;
                }

                .main-content .login-form form .input-form {
                    font-size: 16px;
                    border: none;
                    width: 100%;
                    padding: 15px 15px;
                    margin-bottom: 12px;
                    border: 1px solid #dedddd;
                    outline: none;
                    background: transparent;
                }

                @media all and (max-width: 667px) {
                    .main-content h1 {
                        font-size: 32px;
                    }
                }

                @media all and (max-width: 440px) {
                    .main-content .login-form h6 {
                        padding-top: 4em;
                    }

                    .main-content h1 {
                        font-size: 30px;
                    }
                }

                @media all and (max-width: 410px) {
                    .main-content .login-form h6.sec-one {
                        padding-top: 3.5em;
                    }

                    .main-content .bottom-content {
                        padding: 35px 20px;
                    }
                }
                copy-right.text-center {
                    margin-top: 2em;
                }

                .copy-right p {
                    font-size: 18px;
                    line-height: 29px;
                    color: #fff;
                }

                .copy-right p a {
                    color: #bd783a;
                }

                .copy-right p a:hover {
                    color: #fff;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                `}
            </style>
            <section className="section" style={styles.section}>
                <div className="main-content">
                    <div className="wrapper">
                        <h2 className="title-login-page">TRANG QUẢN LÝ</h2>
                        <h1>LỊCH TRỰC KHOA CÔNG NGHỆ THÔNG TIN</h1>
                        <div className="d-grid">
                            <div className="login-form">
                                <div className="main-bg" style={{margin: '2rem 1rem'}}>
                                    <img src={LogoVLU} style={{ margin: '0 auto', width: '100px', padding: '30px 0' }} />
                                    <h3 className="title-login">Quý thầy cô đã bị từ chối đăng nhập vào hệ thống</h3>
                                    <div className="title-login">Vui lòng liên hệ quản trị viên để biết thêm thông tin</div>
                                </div>
                            </div>
                        </div>
                        <div className="copy-right text-center">
                            <p>
                                &copy; 2024 - Bản Quyền Thuộc Khoa Công nghệ thông tin, Trường Đại Học Văn Lang.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Lockout;