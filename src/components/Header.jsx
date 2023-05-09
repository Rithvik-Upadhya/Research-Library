import React from "react";

function Header() {
	return (
		<header>
			<div className="container" id="header">
				<div className="header-left">
					<a
						href="https://centreforpastoralism.org/"
						aria-label="Go to main website">
						<img src="images/logo.svg" id="logo" alt="" />
					</a>
				</div>
				<div className="header-centre">
					<nav></nav>
				</div>
				<div className="header-right"></div>
			</div>
		</header>
	);
}

export default Header;
