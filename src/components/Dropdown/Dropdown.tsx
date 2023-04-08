interface DropdownItem {
  text: string
  tooltip?: string
  onClick: () => void
}

interface Dropdown {
  items: DropdownItem[]
}

function Dropdown({ items }: Dropdown) {
	return (
		<div className="dropdown">
			<button
				className="btn btn-outline-secondary dropdown-toggle"
				type="button"
				data-bs-toggle="dropdown"
				aria-expanded="false"
				title="More options"
				aria-label="More options"
			>
        ⋮
			</button>
			<ul className="dropdown-menu">
				{items.map((item) => (
					<li key={item.text}>
						<a
							className="dropdown-item"
							href="#"
							onClick={(e) => {
								e.preventDefault();
								item.onClick();
							}}
							role="menuitem"
							title={item.tooltip}
						>
							{item.text}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

export { Dropdown };